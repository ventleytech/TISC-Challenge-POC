import type { StoreSettings } from './config.js';
import { FsObjectStore } from './fs-store.js';
import { MinioObjectStore } from './minio-store.js';
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
