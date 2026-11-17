export interface GatewaySettings {
  host: string;
  port: number;
  publicHost: string;
  rtspPort: number;
  rtmpPort: number;
  sessionDir: string;
}

function requireNonEmpty(name: string, value: string | undefined, fallback: string): string {
  const v = (value ?? fallback).trim();
  if (!v) {
    throw new Error(`${name} must be non-empty`);
  }
  return v;
}

function parsePort(name: string, raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(raw ?? String(fallback), 10);
  if (!Number.isFinite(n) || n < 1 || n > 65535) {
    throw new Error(`${name} invalid: ${raw}`);
  }
  return n;
}

/** Load settings from env. Business code reads GatewaySettings — not raw process.env. */
export function loadSettings(env: NodeJS.ProcessEnv = process.env): GatewaySettings {
  return {
    host: requireNonEmpty('PULSE_GATEWAY_HOST', env.PULSE_GATEWAY_HOST, '0.0.0.0'),
    port: parsePort('PULSE_GATEWAY_PORT', env.PULSE_GATEWAY_PORT, 3020),
    publicHost: requireNonEmpty(
      'PULSE_GATEWAY_PUBLIC_HOST',
      env.PULSE_GATEWAY_PUBLIC_HOST,
      '127.0.0.1',
    ),
    rtspPort: parsePort('PULSE_GATEWAY_RTSP_PORT', env.PULSE_GATEWAY_RTSP_PORT, 8554),
    rtmpPort: parsePort('PULSE_GATEWAY_RTMP_PORT', env.PULSE_GATEWAY_RTMP_PORT, 1935),
    sessionDir: requireNonEmpty(
      'PULSE_GATEWAY_SESSION_DIR',
      env.PULSE_GATEWAY_SESSION_DIR,
      './data/sessions',
    ),
  };
}
