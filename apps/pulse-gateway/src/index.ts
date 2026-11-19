import { loadSettings } from './config.js';
import { createDetectSink } from './detect-sink.js';
import { FileSessionRegistry } from './registry.js';
import { createGatewayServer } from './server.js';

async function main(): Promise<void> {
  const settings = loadSettings();
  const registry = new FileSessionRegistry(settings);
  const detectSink = await createDetectSink(settings.detect);
  const runtime = {
    settings,
    registry,
    detectSink,
    startedAt: new Date().toISOString(),
  };
  const server = createGatewayServer(runtime);

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(settings.port, settings.host, () => resolve());
  });

  console.info(
    `[pulse-gateway] listening host=${settings.host} port=${settings.port} rtsp=${settings.rtspPort} rtmp=${settings.rtmpPort} sessions=${settings.sessionDir} pullTargets=${settings.pullUrls.length} detectSink=${settings.detect.mode}`,
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[pulse-gateway] fatal: ${message}`);
  process.exitCode = 1;
});
