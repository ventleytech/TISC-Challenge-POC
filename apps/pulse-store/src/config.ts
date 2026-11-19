import path from 'node:path';
import type { StoreBackend } from './types.js';

export interface StoreSettings {
  backend: StoreBackend;
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
  fsRoot: string;
  useSSL: boolean;
  /** Retention: age < hotDays → hot (docs/storage-retention.md). */
  hotDays: number;
  /** Retention: age < warmDays → warm; else expire. */
  warmDays: number;
}

function requireNonEmpty(name: string, value: string | undefined, fallback: string): string {
  const v = (value ?? fallback).trim();
  if (!v) {
    throw new Error(`${name} must be non-empty`);
  }
  return v;
}

function parseBackend(raw: string | undefined): StoreBackend {
  const v = (raw ?? 'fs').trim().toLowerCase();
  if (v === 'fs' || v === 'filesystem' || v === 'file') return 'fs';
  if (v === 'minio' || v === 's3') return 'minio';
  throw new Error(`PULSE_STORE_BACKEND invalid: ${raw} (use fs|minio)`);
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === '') return fallback;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  throw new Error(`Boolean env invalid: ${raw}`);
}

function parseDays(name: string, raw: string | undefined, fallback: number): number {
  const v = (raw ?? String(fallback)).trim();
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return n;
}

/** Load settings from env. Callers use StoreSettings — not raw process.env. */
export function loadSettings(env: NodeJS.ProcessEnv = process.env): StoreSettings {
  const endpoint = requireNonEmpty(
    'PULSE_STORE_ENDPOINT',
    env.PULSE_STORE_ENDPOINT,
    'http://127.0.0.1:9000',
  );
  const useSSL = parseBool(env.PULSE_STORE_USE_SSL, endpoint.startsWith('https://'));
  const hotDays = parseDays('PULSE_STORE_HOT_DAYS', env.PULSE_STORE_HOT_DAYS, 30);
  const warmDays = parseDays('PULSE_STORE_WARM_DAYS', env.PULSE_STORE_WARM_DAYS, 365);
  if (warmDays < hotDays) {
    throw new Error('PULSE_STORE_WARM_DAYS must be >= PULSE_STORE_HOT_DAYS');
  }

  return {
    backend: parseBackend(env.PULSE_STORE_BACKEND),
    endpoint,
    bucket: requireNonEmpty('PULSE_STORE_BUCKET', env.PULSE_STORE_BUCKET, 'voltpulse-evidence'),
    accessKey: requireNonEmpty(
      'PULSE_STORE_ACCESS_KEY',
      env.PULSE_STORE_ACCESS_KEY,
      'minioadmin',
    ),
    secretKey: requireNonEmpty(
      'PULSE_STORE_SECRET_KEY',
      env.PULSE_STORE_SECRET_KEY,
      'change-me-local-only',
    ),
    region: requireNonEmpty('PULSE_STORE_REGION', env.PULSE_STORE_REGION, 'us-east-1'),
    fsRoot: path.resolve(
      requireNonEmpty(
        'PULSE_STORE_FS_ROOT',
        env.PULSE_STORE_FS_ROOT,
        './.pulse-store-data',
      ),
    ),
    useSSL,
    hotDays,
    warmDays,
  };
}
