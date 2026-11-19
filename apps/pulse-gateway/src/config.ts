export interface GatewaySettings {
  host: string;
  port: number;
  publicHost: string;
  rtspPort: number;
  rtmpPort: number;
  sessionDir: string;
  /** Configured live-pull targets (rtsp:// / rtmp://); empty when unset. */
  pullUrls: string[];
  detect: DetectSettings;
}

export type DetectSinkMode = 'off' | 'file' | 'kafka';

export interface DetectSettings {
  /** off (default) | file (jsonl bus) | kafka (needs brokers). */
  mode: DetectSinkMode;
  topic: string;
  filePath: string;
  brokers: string | null;
  clientId: string;
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

function parsePullUrls(raw: string | undefined): string[] {
  const urls = (raw ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
  for (const u of urls) {
    if (!/^(rtsp|rtmp):\/\//i.test(u)) {
      throw new Error(`PULSE_GATEWAY_PULL_URLS entry must be rtsp:// or rtmp://: ${u}`);
    }
  }
  return urls;
}

function parseDetect(env: NodeJS.ProcessEnv): DetectSettings {
  const mode = (env.PULSE_GATEWAY_DETECT_SINK ?? 'off').trim().toLowerCase();
  if (mode !== 'off' && mode !== 'file' && mode !== 'kafka') {
    throw new Error(`PULSE_GATEWAY_DETECT_SINK must be off|file|kafka: ${mode}`);
  }
  const brokers = env.KAFKA_BROKERS?.trim() || null;
  if (mode === 'kafka' && !brokers) {
    throw new Error('PULSE_GATEWAY_DETECT_SINK=kafka requires KAFKA_BROKERS');
  }
  return {
    mode,
    topic: requireNonEmpty('PULSE_DETECT_TOPIC', env.PULSE_DETECT_TOPIC, 'vp.detect.v1'),
    filePath: requireNonEmpty(
      'PULSE_GATEWAY_DETECT_FILE',
      env.PULSE_GATEWAY_DETECT_FILE,
      './data/bus/vp.detect.v1.jsonl',
    ),
    brokers,
    clientId: requireNonEmpty(
      'PULSE_GATEWAY_KAFKA_CLIENT_ID',
      env.PULSE_GATEWAY_KAFKA_CLIENT_ID,
      'pulse-gateway',
    ),
  };
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
    pullUrls: parsePullUrls(env.PULSE_GATEWAY_PULL_URLS),
    detect: parseDetect(env),
  };
}
