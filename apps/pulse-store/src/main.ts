import { loadSettings } from './config.js';
import { createRetentionStore } from './create-store.js';
import { loadHttpSettings } from './http-config.js';
import { createStoreServer } from './server.js';

async function main(): Promise<void> {
  const settings = loadSettings();
  const httpSettings = loadHttpSettings();
  const server = createStoreServer(createRetentionStore(settings), httpSettings, {
    bucket: settings.bucket,
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(httpSettings.port, httpSettings.host, () => resolve());
  });

  console.info(
    `[pulse-store] listening host=${httpSettings.host} port=${httpSettings.port} backend=${settings.backend} bucket=${settings.bucket} endpoint=${settings.endpoint}`,
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[pulse-store] fatal: ${message}`);
  process.exitCode = 1;
});
