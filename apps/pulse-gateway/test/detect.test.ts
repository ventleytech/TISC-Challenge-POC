import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { loadSettings } from '../src/config.js';
import { FileDetectSink, KafkaDetectSink, type DetectSink } from '../src/detect-sink.js';
import { FileSessionRegistry } from '../src/registry.js';
import { createGatewayServer } from '../src/server.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function withServer(
  extraEnv: Record<string, string>,
  mkSink: (dir: string) => DetectSink | null,
  fn: (base: string, dir: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(path.join(tmpdir(), 'vp-gw-det-'));
  const settings = loadSettings({ PULSE_GATEWAY_SESSION_DIR: dir, ...extraEnv });
  const server = createGatewayServer({
    settings,
    registry: new FileSessionRegistry(settings),
    startedAt: new Date().toISOString(),
    detectSink: mkSink(dir),
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('bind failed');
  try {
    await fn(`http://127.0.0.1:${addr.port}`, dir);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    await rm(dir, { recursive: true, force: true });
  }
}

const post = (url: string, body: unknown = {}) =>
  fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('config: bad sink mode, kafka without brokers, bad pull url all throw', () => {
  assert.throws(() => loadSettings({ PULSE_GATEWAY_DETECT_SINK: 'nope' }));
  assert.throws(() => loadSettings({ PULSE_GATEWAY_DETECT_SINK: 'kafka' }));
  assert.throws(() => loadSettings({ PULSE_GATEWAY_PULL_URLS: 'http://x/y' }));
  assert.equal(loadSettings({}).detect.mode, 'off');
});

test('pull/sync registers configured URLs once (idempotent)', async () => {
  const env = { PULSE_GATEWAY_PULL_URLS: 'rtsp://cam1:8554/live/a, rtmp://cam2/live/b' };
  await withServer(env, () => null, async (base) => {
    const targets = (await (await fetch(`${base}/pull/targets`)).json()) as { items: string[] };
    assert.equal(targets.items.length, 2);
    const first = (await (await post(`${base}/pull/sync`)).json()) as { items: { created: boolean }[] };
    assert.deepEqual(first.items.map((i) => i.created), [true, true]);
    const second = (await (await post(`${base}/pull/sync`)).json()) as { items: { created: boolean }[] };
    assert.deepEqual(second.items.map((i) => i.created), [false, false]);
    const list = (await (await fetch(`${base}/sessions`)).json()) as { items: { protocol: string }[] };
    assert.deepEqual(list.items.map((s) => s.protocol), ['rtsp', 'rtmp']);
  });
});

test('frames: sink off → 409', async () => {
  await withServer({}, () => null, async (base) => {
    const s = (await (await post(`${base}/sessions`, { name: 'x', protocol: 'rtsp', path: 'live/x' })).json()) as { id: string };
    assert.equal((await post(`${base}/sessions/${s.id}/frames`)).status, 409);
  });
});

test('frames: file sink writes contract-shaped vp.detect.v1 line', async () => {
  const file = (dir: string) => path.join(dir, 'bus.jsonl');
  await withServer({}, (dir) => new FileDetectSink(file(dir)), async (base, dir) => {
    const s = (await (await post(`${base}/sessions`, { name: 'x', protocol: 'rtsp', path: 'live/x' })).json()) as { id: string };
    const res = await post(`${base}/sessions/${s.id}/frames`, { class_id: 'corrosion', confidence: 0.8, bbox: [1, 2, 3, 4] });
    assert.equal(res.status, 202);
    const lines = (await readFile(file(dir), 'utf8')).trim().split('\n');
    assert.equal(lines.length, 1);
    const ev = JSON.parse(lines[0]);
    assert.match(ev.event_id, UUID);
    assert.match(ev.inspection_id, UUID);
    assert.equal(ev.source, 'live');
    assert.equal(ev.detections[0].class_id, 'corrosion');
    assert.match(ev.detections[0].reason, /no inference/);
    assert.equal((await post(`${base}/sessions/${s.id}/frames`, { class_id: 'bogus' })).status, 400);
    assert.equal((await post(`${base}/sessions/${s.id}/frames`, { inspection_id: 'nope' })).status, 400);
  });
});

test('frames: kafka sink sends to topic keyed by inspection_id', async () => {
  const sent: Array<{ topic: string; messages: Array<{ key: string; value: string }> }> = [];
  const sink = new KafkaDetectSink({ send: async (a) => void sent.push(a), disconnect: async () => {} }, 'vp.detect.v1');
  await withServer({}, () => sink, async (base) => {
    const s = (await (await post(`${base}/sessions`, { name: 'x', protocol: 'rtsp', path: 'live/x' })).json()) as { id: string };
    const r = (await (await post(`${base}/sessions/${s.id}/frames`)).json()) as { inspection_id: string; sink: string };
    assert.equal(r.sink, 'kafka');
    assert.equal(sent[0].topic, 'vp.detect.v1');
    assert.equal(sent[0].messages[0].key, r.inspection_id);
  });
});
