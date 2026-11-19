import path from 'node:path';
import type { StoreSettings } from './config.js';
import { FsObjectStore } from './fs-store.js';
import { MinioObjectStore } from './minio-store.js';
import { MetaIndex } from './object-meta.js';
import { retentionPolicyFromSettings } from './retention-policy.js';
import { RetentionStore } from './retention-store.js';
import type { ObjectStore } from './types.js';

export function createStore(settings: StoreSettings): ObjectStore {
  if (settings.backend === 'fs') {
    return new FsObjectStore(settings.fsRoot, settings.bucket);
  }
  if (settings.backend === 'minio') {
    return new MinioObjectStore(settings);
  }
  const _exhaustive: never = settings.backend;
  throw new Error(`unsupported backend: ${_exhaustive}`);
}

/** Object store + retention meta index under fsRoot (M07/E03/E04 thin). */
export function createRetentionStore(settings: StoreSettings): RetentionStore {
  const store = createStore(settings);
  const meta = new MetaIndex(path.join(settings.fsRoot, '.retention-meta.json'));
  return new RetentionStore(store, meta, retentionPolicyFromSettings(settings));
}
