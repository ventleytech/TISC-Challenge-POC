export type ReloadMode = 'log' | 'http' | 'off';

export interface TrainSettings {
  host: string;
  port: number;
  labelsTopic: string;
  modelsTopic: string;
  storeEndpoint: string;
  dataDir: string;
  reloadMode: ReloadMode;
  reloadUrl: string;
  jobAutoAdvance: boolean;
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
    throw new Error(`PULSE_TRAIN_PORT invalid: ${raw}`);
  }
  return n;
}

function parseReloadMode(raw: string | undefined): ReloadMode {
  const v = (raw ?? 'log').trim().toLowerCase();
  if (v === 'log' || v === 'http' || v === 'off') return v;
  throw new Error(`PULSE_TRAIN_RELOAD_MODE invalid: ${raw}`);
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === '') return fallback;
  const v = raw.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  throw new Error(`boolean env invalid: ${raw}`);
}

/** Load settings from env. Business code reads TrainSettings — not raw process.env. */
export function loadSettings(env: NodeJS.ProcessEnv = process.env): TrainSettings {
  return {
    host: requireNonEmpty('PULSE_TRAIN_HOST', env.PULSE_TRAIN_HOST, '0.0.0.0'),
    port: parsePort(env.PULSE_TRAIN_PORT, 3020),
    labelsTopic: requireNonEmpty('PULSE_LABELS_TOPIC', env.PULSE_LABELS_TOPIC, 'vp.labels.v1'),
    modelsTopic: requireNonEmpty('PULSE_MODELS_TOPIC', env.PULSE_MODELS_TOPIC, 'vp.models.v1'),
    storeEndpoint: requireNonEmpty(
      'PULSE_STORE_ENDPOINT',
      env.PULSE_STORE_ENDPOINT,
      'http://127.0.0.1:9000',
    ),
    dataDir: requireNonEmpty('PULSE_TRAIN_DATA_DIR', env.PULSE_TRAIN_DATA_DIR, './data'),
    reloadMode: parseReloadMode(env.PULSE_TRAIN_RELOAD_MODE),
    reloadUrl: requireNonEmpty(
      'PULSE_TRAIN_RELOAD_URL',
      env.PULSE_TRAIN_RELOAD_URL,
      'http://127.0.0.1:3015/internal/reload',
    ),
    jobAutoAdvance: parseBool(env.PULSE_TRAIN_JOB_AUTO_ADVANCE, true),
  };
}
