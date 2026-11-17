import { createMockBus } from './bus/mock-consumer.js';
import { loadSettings } from './config.js';
import { createDatasetQueue } from './dataset/queue.js';
import { createRetrainStore } from './jobs/retrain.js';
import { createModelRegistry } from './registry/models.js';
import { createTrainServer } from './server.js';

async function main(): Promise<void> {
  const settings = loadSettings();
  const bus = createMockBus(settings.labelsTopic);
  const queue = createDatasetQueue(settings.dataDir);
  const jobs = createRetrainStore();
  const registry = createModelRegistry();
  const runtime = {
    settings,
    bus,
    queue,
    jobs,
    registry,
    startedAt: new Date().toISOString(),
  };
  const server = createTrainServer(runtime);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(settings.port, settings.host, () => resolve());
  });

  console.info(
    `[pulse-train] listening host=${settings.host} port=${settings.port} labels=${settings.labelsTopic} models=${settings.modelsTopic} reload=${settings.reloadMode}`,
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[pulse-train] fatal: ${message}`);
  process.exitCode = 1;
});
