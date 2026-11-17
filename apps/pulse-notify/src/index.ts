import { createMockBus } from './bus/mock-consumer.js';
import { loadSettings } from './config.js';
import { createNotifyServer } from './server.js';

async function main(): Promise<void> {
  const settings = loadSettings();
  const bus = createMockBus(settings.alertsTopic);
  const runtime = {
    settings,
    bus,
    startedAt: new Date().toISOString(),
  };
  const server = createNotifyServer(runtime);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(settings.port, settings.host, () => resolve());
  });

  console.info(
    `[pulse-notify] listening host=${settings.host} port=${settings.port} topic=${settings.alertsTopic} adapter=${settings.adapter} ack=${settings.ackMode}`,
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[pulse-notify] fatal: ${message}`);
  process.exitCode = 1;
});
