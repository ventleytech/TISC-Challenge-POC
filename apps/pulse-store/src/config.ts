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

/** Load settings from env. Callers use StoreSettings — not raw process.env. */
export function loadSettings(env: NodeJS.ProcessEnv = process.env): StoreSettings {
  const endpoint = requireNonEmpty(
    'PULSE_STORE_ENDPOINT',
    env.PULSE_STORE_ENDPOINT,
    'http://127.0.0.1:9000',
  );
  const useSSL = parseBool(env.PULSE_STORE_USE_SSL, endpoint.startsWith('https://'));

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
  };
}
