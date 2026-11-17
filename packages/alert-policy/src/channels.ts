import type { AlertChannel, AlertPolicy, ChannelConfig } from './types.js';
import { ALERT_CHANNELS } from './types.js';

export function getChannelConfig(
  policy: AlertPolicy,
  channel: AlertChannel,
): ChannelConfig {
  const cfg = policy.channels[channel];
  if (!cfg) {
    throw new Error(`Unknown alert channel: ${channel}`);
  }
  return cfg;
}

export function isChannelEnabled(
  policy: AlertPolicy,
  channel: AlertChannel,
): boolean {
  const cfg = getChannelConfig(policy, channel);
  return cfg.enabled && cfg.adapter !== 'off';
}

/**
 * Resolve delivery channels for an alert.
 * Uses `requested` when provided; otherwise `policy.defaultChannels`.
 * Drops disabled / off adapters.
 */
export function resolveChannels(
  policy: AlertPolicy,
  requested?: readonly AlertChannel[],
): AlertChannel[] {
  const source = requested?.length
    ? requested
    : policy.defaultChannels;
  const out: AlertChannel[] = [];
  for (const ch of source) {
    if (!ALERT_CHANNELS.includes(ch)) {
      throw new Error(`Invalid alert channel: ${String(ch)}`);
    }
    if (isChannelEnabled(policy, ch) && !out.includes(ch)) {
      out.push(ch);
    }
  }
  return out;
}

/** Channels currently enabled under this policy. */
export function listEnabledChannels(policy: AlertPolicy): AlertChannel[] {
  return ALERT_CHANNELS.filter((ch) => isChannelEnabled(policy, ch));
}
