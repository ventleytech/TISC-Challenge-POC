#!/usr/bin/env node
/**
 * Container entrypoint (P0-T340 stub): validate settings, serve /health.
 * Kafka consume/produce loop is a follow-up card; processDetectEvent stays pure.
 */
import { createServer } from 'node:http';
import { loadSettings } from './config/settings.js';

const settings = loadSettings();
const portRaw = process.env.GRID_RULES_HEALTH_PORT ?? '8080';
const port = Number(portRaw);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid GRID_RULES_HEALTH_PORT: ${portRaw}`);
}

const body = JSON.stringify({
  status: 'ok',
  service: settings.serviceName,
  detect_topic: settings.topics.detect,
});

createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(body);
    return;
  }
  res.writeHead(404).end();
}).listen(port, () => {
  console.log(`${settings.serviceName} health on :${port}`);
});
