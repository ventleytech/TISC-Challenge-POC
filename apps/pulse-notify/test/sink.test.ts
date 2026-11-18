import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createMockBus, parseVpAlertsV1 } from '../src/bus/mock-consumer.js';
import { loadSettings } from '../src/config.js';
import { processAlertEvent } from '../src/pipeline.js';

const sample = parseVpAlertsV1({
  event_id: '11111111-1111-1111-1111-111111111111',
  occurred_at: '2026-11-18T00:00:00.000Z',
  alert: {
    alert_id: '22222222-2222-2222-2222-222222222222',
    finding_id: '33333333-3333-3333-3333-333333333333',
    severity: 'high',
    sla_due_at: '2026-11-18T01:00:00.000Z',
    channels: ['push', 'sms', 'email'],
  },
});

test('config: webhook/file adapters require target', () => {
  assert.throws(() => loadSettings({ PULSE_NOTIFY_ADAPTER: 'webhook' }), /WEBHOOK_URL/);
  assert.throws(() => loadSettings({ PULSE_NOTIFY_ADAPTER: 'file' }), /FILE_PATH/);
  assert.throws(() => loadSettings({ PULSE_NOTIFY_ADAPTER: 'sms' }), /invalid/);
});

test('file adapter appends one JSON line per sent channel', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'vp-notify-'));
  const file = path.join(dir, 'nested', 'out.jsonl');
  const settings = loadSettings({ PULSE_NOTIFY_ADAPTER: 'file', PULSE_NOTIFY_FILE_PATH: file });
  const r = await processAlertEvent(settings, createMockBus(settings.alertsTopic), sample);
  const lines = (await readFile(file, 'utf8')).trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(lines.map((l) => l.channel), ['push', 'sms']); // email skipped
  assert.equal(lines[0].alert_id, sample.alert.alert_id);
  assert.deepEqual(r.deliveries.map((d) => d.status), ['sent', 'sent', 'skipped']);
});

test('webhook adapter POSTs; non-2xx and network errors mark failed', async () => {
  const got: unknown[] = [];
  const srv = http.createServer((req, res) => {
    const c: Buffer[] = [];
    req.on('data', (d) => c.push(d));
    req.on('end', () => {
      got.push(JSON.parse(Buffer.concat(c).toString()));
      res.writeHead(req.headers['x-fail'] ? 500 : 200).end('ok');
    });
  });
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r));
  const port = (srv.address() as { port: number }).port;
  const env = {
    PULSE_NOTIFY_ADAPTER: 'webhook',
    PULSE_NOTIFY_WEBHOOK_URL: `http://127.0.0.1:${port}/hook`,
  };
  const ok = await processAlertEvent(loadSettings(env), createMockBus('t'), sample);
  assert.equal(got.length, 2);
  assert.deepEqual(ok.deliveries.map((d) => d.status), ['sent', 'sent', 'skipped']);
  assert.match(ok.deliveries[0].detail, /webhook:http 200/);

  const failing: typeof fetch = (u, init) =>
    fetch(u, { ...init, headers: { ...(init?.headers as object), 'x-fail': '1' } });
  const bad = await processAlertEvent(loadSettings(env), createMockBus('t'), sample, failing);
  assert.equal(bad.deliveries[0].status, 'failed');
  assert.match(bad.deliveries[0].detail, /http 500/);
  await new Promise((r) => srv.close(r));

  const down = await processAlertEvent(loadSettings(env), createMockBus('t'), sample);
  assert.equal(down.deliveries[0].status, 'failed'); // connection refused, no throw
});
