export type NotifyAdapter = 'log' | 'webhook' | 'file';
export type AckMode = 'log' | 'http' | 'off';

export interface NotifySettings {
  host: string;
  port: number;
  alertsTopic: string;
  adapter: NotifyAdapter;
  apiBaseUrl: string;
  ackPath: string;
  ackMode: AckMode;
  /** adapter=webhook: POST target. */
  webhookUrl: string;
  webhookTimeoutMs: number;
  /** adapter=file: JSON-lines sink path. */
  filePath: string;
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
  if (v === 'log' || v === 'webhook' || v === 'file') return v;
  throw new Error(`PULSE_NOTIFY_ADAPTER invalid: ${raw} (log|webhook|file)`);
}

function parseWebhookUrl(raw: string | undefined): string {
  const v = (raw ?? '').trim();
  if (!v) return '';
  const u = new URL(v); // throws on garbage
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error(`PULSE_NOTIFY_WEBHOOK_URL must be http(s): ${raw}`);
  }
  return v;
}

function parseTimeout(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? '5000', 10);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`PULSE_NOTIFY_WEBHOOK_TIMEOUT_MS invalid: ${raw}`);
  }
  return n;
}

function parseAckMode(raw: string | undefined): AckMode {
  const v = (raw ?? 'log').trim().toLowerCase();
  if (v === 'log' || v === 'http' || v === 'off') return v;
  throw new Error(`PULSE_NOTIFY_ACK_MODE invalid: ${raw}`);
}

/** Load settings from env. Business code reads NotifySettings — not raw process.env. */
export function loadSettings(env: NodeJS.ProcessEnv = process.env): NotifySettings {
  const adapter = parseAdapter(env.PULSE_NOTIFY_ADAPTER);
  const webhookUrl = parseWebhookUrl(env.PULSE_NOTIFY_WEBHOOK_URL);
  const filePath = (env.PULSE_NOTIFY_FILE_PATH ?? '').trim();
  if (adapter === 'webhook' && !webhookUrl) {
    throw new Error('PULSE_NOTIFY_WEBHOOK_URL required when PULSE_NOTIFY_ADAPTER=webhook');
  }
  if (adapter === 'file' && !filePath) {
    throw new Error('PULSE_NOTIFY_FILE_PATH required when PULSE_NOTIFY_ADAPTER=file');
  }
  return {
    host: requireNonEmpty('PULSE_NOTIFY_HOST', env.PULSE_NOTIFY_HOST, '0.0.0.0'),
    port: parsePort(env.PULSE_NOTIFY_PORT, 3010),
    alertsTopic: requireNonEmpty('PULSE_ALERTS_TOPIC', env.PULSE_ALERTS_TOPIC, 'vp.alerts.v1'),
    adapter,
    webhookUrl,
    webhookTimeoutMs: parseTimeout(env.PULSE_NOTIFY_WEBHOOK_TIMEOUT_MS),
    filePath,
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
