export type NotifyAdapter = 'log';
export type AckMode = 'log' | 'http' | 'off';

export interface NotifySettings {
  host: string;
  port: number;
  alertsTopic: string;
  adapter: NotifyAdapter;
  apiBaseUrl: string;
  ackPath: string;
  ackMode: AckMode;
}

function requireNonEmpty(name: string, value: string | undefined, fallback: string): string {
  const v = (value ?? fallback).trim();
  if (!v) {
    throw new Error(`${name} must be non-empty`);
  }
  return v;
}

function parsePort(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(raw ?? String(fallback), 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    throw new Error(`PULSE_NOTIFY_PORT invalid: ${raw}`);
  }
  return n;
}

function parseAdapter(raw: string | undefined): NotifyAdapter {
  const v = (raw ?? 'log').trim().toLowerCase();
  if (v === 'log') return 'log';
  throw new Error(`PULSE_NOTIFY_ADAPTER unsupported for mock: ${raw} (use log)`);
}

function parseAckMode(raw: string | undefined): AckMode {
  const v = (raw ?? 'log').trim().toLowerCase();
  if (v === 'log' || v === 'http' || v === 'off') return v;
  throw new Error(`PULSE_NOTIFY_ACK_MODE invalid: ${raw}`);
}

/** Load settings from env. Business code reads NotifySettings — not raw process.env. */
export function loadSettings(env: NodeJS.ProcessEnv = process.env): NotifySettings {
  return {
    host: requireNonEmpty('PULSE_NOTIFY_HOST', env.PULSE_NOTIFY_HOST, '0.0.0.0'),
    port: parsePort(env.PULSE_NOTIFY_PORT, 3010),
    alertsTopic: requireNonEmpty('PULSE_ALERTS_TOPIC', env.PULSE_ALERTS_TOPIC, 'vp.alerts.v1'),
    adapter: parseAdapter(env.PULSE_NOTIFY_ADAPTER),
    apiBaseUrl: requireNonEmpty(
      'PULSE_API_BASE_URL',
      env.PULSE_API_BASE_URL,
      'http://127.0.0.1:3000',
    ),
    ackPath: requireNonEmpty(
      'PULSE_NOTIFY_ACK_PATH',
      env.PULSE_NOTIFY_ACK_PATH,
      '/api/v1/alerts',
    ),
    ackMode: parseAckMode(env.PULSE_NOTIFY_ACK_MODE),
  };
}
