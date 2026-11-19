#!/usr/bin/env node
/**
 * Container entrypoint: /health + rules loop (file-bus tail and/or Kafka consume,
 * file and/or Kafka emit — each env-gated, see README). With every input unset the
 * service only serves /health.
 */
import { createServer } from 'node:http';
import { loadSettings } from './config/settings.js';
import { startLoop } from './loop.js';

const settings = loadSettings();
const portRaw = process.env.GRID_RULES_HEALTH_PORT ?? '8080';
const port = Number(portRaw);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid GRID_RULES_HEALTH_PORT: ${portRaw}`);
}

const loop = await startLoop(settings);

function metricsText(): string {
  return [
    '# HELP vp_up VoltPulse process up',
    '# TYPE vp_up gauge',
    'vp_up{service="grid-rules",plane="stream"} 1',
    '',
  ].join('\n');
}

const server = createServer((req, res) => {
  const path = req.url?.split('?')[0] ?? '';
  if (path === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: settings.serviceName,
        detect_topic: settings.topics.detect,
        loop: loop.stats,
      }),
    );
    return;
  }
  if (path === '/metrics') {
    res.writeHead(200, {
      'content-type': 'text/plain; version=0.0.4; charset=utf-8',
    });
    res.end(metricsText());
    return;
  }
  res.writeHead(404).end();
});
server.listen(port, () => {
  console.log(`${settings.serviceName} health on :${port}`);
});

for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sig, () => {
    server.close();
    void loop.stop().finally(() => process.exit(0));
  });
}
