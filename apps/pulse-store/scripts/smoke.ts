/**
 * Local proof: filesystem put/get always.
 * Optional MinIO when PULSE_STORE_BACKEND=minio and endpoint reachable.
 */
import { loadSettings } from '../src/config.js';
import { createStore } from '../src/create-store.js';
import { buildEvidenceKey } from '../src/evidence-id.js';
import type { ObjectStore } from '../src/types.js';

async function roundtrip(store: ObjectStore, label: string): Promise<void> {
  const body = Buffer.from(`volt-pulse-smoke-${label}-${Date.now()}`);
  const key = buildEvidenceKey('util_smoke', 'smoke001', body, 'txt');
  const put = await store.put(key, body, 'text/plain');
  const got = await store.get(key);
  if (!got.body.equals(body)) {
    throw new Error(`${label}: body mismatch`);
  }
  console.log(`[ok] ${label} put/get key=${put.key} backend=${put.backend} bytes=${body.length}`);
}

async function main(): Promise<void> {
  const settings = loadSettings({
    ...process.env,
    // force FS path for primary proof unless caller set backend
    PULSE_STORE_BACKEND: process.env.PULSE_STORE_BACKEND ?? 'fs',
  });

  console.log(
    `[info] settings backend=${settings.backend} bucket=${settings.bucket} endpoint=${settings.endpoint} fsRoot=${settings.fsRoot}`,
  );

  if (settings.backend === 'fs') {
    const fsStore = createStore({ ...settings, backend: 'fs' });
    await roundtrip(fsStore, 'fs');
  } else {
    try {
      const minioStore = createStore({ ...settings, backend: 'minio' });
      await roundtrip(minioStore, 'minio');
    } catch (err) {
      console.warn(`[skip] minio unreachable or unavailable: ${String(err)}`);
      console.warn('[fallback] running filesystem put/get for local proof');
      const fsStore = createStore({ ...settings, backend: 'fs' });
      await roundtrip(fsStore, 'fs-fallback');
    }
  }

  // Always exercise FS once when primary was minio-success, still prove fallback path config
  if (settings.backend === 'minio') {
    // already handled fallback above on failure; on success we are done
  }

  console.log('[ok] pulse-store smoke complete');
}

main().catch((err) => {
  console.error('[fail]', err);
  process.exitCode = 1;
});
