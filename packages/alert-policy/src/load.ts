import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_ALERT_POLICY } from './defaults.js';
import {
  ALERT_CHANNELS,
  CHANNEL_ADAPTERS,
  SEVERITIES,
  type AlertChannel,
  type AlertPolicy,
  type ChannelAdapter,
  type ChannelConfig,
  type LoadAlertPolicyOptions,
  type Severity,
} from './types.js';

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_POLICY_PATH = join(PKG_ROOT, 'config', 'default-policy.json');

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === '') return fallback;
  const v = raw.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  throw new Error(`Invalid boolean: ${raw}`);
}

function parseIntMin(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }
  return n;
}

function parseAdapter(raw: string | undefined, fallback: ChannelAdapter): ChannelAdapter {
  if (raw === undefined || raw === '') return fallback;
  const v = raw.trim().toLowerCase();
  if ((CHANNEL_ADAPTERS as readonly string[]).includes(v)) {
    return v as ChannelAdapter;
  }
  throw new Error(`Invalid channel adapter: ${raw} (use mock|off)`);
}

function parseChannelsList(raw: string | undefined, fallback: AlertChannel[]): AlertChannel[] {
  if (raw === undefined || raw === '') return [...fallback];
  const parts = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const out: AlertChannel[] = [];
  for (const p of parts) {
    if (!(ALERT_CHANNELS as readonly string[]).includes(p)) {
      throw new Error(`Invalid channel in VP_ALERT_DEFAULT_CHANNELS: ${p}`);
    }
    const ch = p as AlertChannel;
    if (!out.includes(ch)) out.push(ch);
  }
  return out;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parseChannelConfig(raw: unknown, channel: AlertChannel): ChannelConfig {
  if (!isPlainObject(raw)) {
    throw new Error(`channels.${channel} must be an object`);
  }
  const enabled = raw.enabled;
  const adapter = raw.adapter;
  if (typeof enabled !== 'boolean') {
    throw new Error(`channels.${channel}.enabled must be boolean`);
  }
  if (typeof adapter !== 'string' || !(CHANNEL_ADAPTERS as readonly string[]).includes(adapter)) {
    throw new Error(`channels.${channel}.adapter must be mock|off`);
  }
  return { enabled, adapter: adapter as ChannelAdapter };
}

/** Validate + normalize a partial JSON document into AlertPolicy. */
export function parseAlertPolicyJson(raw: unknown): AlertPolicy {
  if (!isPlainObject(raw)) {
    throw new Error('Alert policy JSON must be an object');
  }

  const version = raw.version === undefined ? 1 : Number(raw.version);
  if (!Number.isFinite(version) || version < 1) {
    throw new Error(`Invalid policy version: ${String(raw.version)}`);
  }

  const channelsRaw = raw.channels;
  if (!isPlainObject(channelsRaw)) {
    throw new Error('channels must be an object');
  }

  const channels = {} as Record<AlertChannel, ChannelConfig>;
  for (const ch of ALERT_CHANNELS) {
    if (!(ch in channelsRaw)) {
      throw new Error(`Missing channels.${ch}`);
    }
    channels[ch] = parseChannelConfig(channelsRaw[ch], ch);
  }

  const defaultChannelsRaw = raw.defaultChannels;
  if (!Array.isArray(defaultChannelsRaw) || defaultChannelsRaw.length === 0) {
    throw new Error('defaultChannels must be a non-empty array');
  }
  const defaultChannels: AlertChannel[] = [];
  for (const item of defaultChannelsRaw) {
    if (typeof item !== 'string' || !(ALERT_CHANNELS as readonly string[]).includes(item)) {
      throw new Error(`Invalid defaultChannels entry: ${String(item)}`);
    }
    const ch = item as AlertChannel;
    if (!defaultChannels.includes(ch)) defaultChannels.push(ch);
  }

  const slaRaw = raw.slaMinutes;
  if (!isPlainObject(slaRaw)) {
    throw new Error('slaMinutes must be an object');
  }
  const slaMinutes = {} as Record<Severity, number>;
  for (const sev of SEVERITIES) {
    const n = Number(slaRaw[sev]);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error(`Invalid slaMinutes.${sev}`);
    }
    slaMinutes[sev] = n;
  }

  return { version, channels, defaultChannels, slaMinutes };
}

function readPolicyFile(path: string): AlertPolicy {
  const text = readFileSync(path, 'utf8');
  return parseAlertPolicyJson(JSON.parse(text) as unknown);
}

function resolvePolicyPath(env: NodeJS.ProcessEnv, explicit?: string): string {
  const fromEnv = (env.VP_ALERT_POLICY_PATH ?? '').trim();
  const chosen = (explicit ?? fromEnv).trim();
  if (!chosen) return DEFAULT_POLICY_PATH;
  return isAbsolute(chosen) ? chosen : join(process.cwd(), chosen);
}

function applyEnvOverlay(base: AlertPolicy, env: NodeJS.ProcessEnv): AlertPolicy {
  const adapter = parseAdapter(
    env.VP_ALERT_CHANNEL_ADAPTER,
    base.channels.push.adapter,
  );

  const channels: Record<AlertChannel, ChannelConfig> = {
    push: {
      enabled: parseBool(env.VP_ALERT_CHANNEL_PUSH_ENABLED, base.channels.push.enabled),
      adapter: parseAdapter(env.VP_ALERT_CHANNEL_PUSH_ADAPTER, adapter),
    },
    sms: {
      enabled: parseBool(env.VP_ALERT_CHANNEL_SMS_ENABLED, base.channels.sms.enabled),
      adapter: parseAdapter(env.VP_ALERT_CHANNEL_SMS_ADAPTER, adapter),
    },
    email: {
      enabled: parseBool(env.VP_ALERT_CHANNEL_EMAIL_ENABLED, base.channels.email.enabled),
      adapter: parseAdapter(env.VP_ALERT_CHANNEL_EMAIL_ADAPTER, adapter),
    },
  };

  return {
    version: base.version,
    channels,
    defaultChannels: parseChannelsList(env.VP_ALERT_DEFAULT_CHANNELS, base.defaultChannels),
    slaMinutes: {
      critical: parseIntMin(env.VP_ALERT_SLA_CRITICAL_MIN, base.slaMinutes.critical, 'VP_ALERT_SLA_CRITICAL_MIN'),
      high: parseIntMin(env.VP_ALERT_SLA_HIGH_MIN, base.slaMinutes.high, 'VP_ALERT_SLA_HIGH_MIN'),
      medium: parseIntMin(env.VP_ALERT_SLA_MEDIUM_MIN, base.slaMinutes.medium, 'VP_ALERT_SLA_MEDIUM_MIN'),
      low: parseIntMin(env.VP_ALERT_SLA_LOW_MIN, base.slaMinutes.low, 'VP_ALERT_SLA_LOW_MIN'),
      info: parseIntMin(env.VP_ALERT_SLA_INFO_MIN, base.slaMinutes.info, 'VP_ALERT_SLA_INFO_MIN'),
    },
  };
}

/**
 * Load alert policy from JSON (default package file) then apply env overlays.
 * Business code should call this once and read the returned `AlertPolicy`.
 */
export function loadAlertPolicy(opts: LoadAlertPolicyOptions = {}): AlertPolicy {
  const env = opts.env ?? process.env;
  let base: AlertPolicy;
  if (opts.base) {
    base = opts.base;
  } else {
    const path = resolvePolicyPath(env, opts.path);
    try {
      base = readPolicyFile(path);
    } catch (err) {
      if (path === DEFAULT_POLICY_PATH && opts.path === undefined && !(env.VP_ALERT_POLICY_PATH ?? '').trim()) {
        // Fallback if package JSON missing in odd install layouts
        base = structuredClone(DEFAULT_ALERT_POLICY);
      } else {
        throw err;
      }
    }
  }
  return applyEnvOverlay(base, env);
}
