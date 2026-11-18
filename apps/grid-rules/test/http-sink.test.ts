import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HttpSink, httpSinkEnabled } from '../src/bus/http-sink.js';
import { loadDetectFixture } from '../src/bus/fixture-source.js';
import { MemorySink } from '../src/bus/memory-sink.js';
import { loadSettings } from '../src/config/settings.js';
import { processDetectEvent } from '../src/rules-engine.js';
import { readFile } from 'node:fs/promises';

const fixtures = new URL('../fixtures/', import.meta.url).pathname;

async function emitted(settings: ReturnType<typeof loadSettings>) {
  const detect = await loadDetectFixture(`${fixtures}synthetic-detect.v1.json`);
  const assets = JSON.parse(await readFile(`${fixtures}assets.json`, 'utf8'));
  return new MemorySink(settings).emit(processDetectEvent(detect, { settings, assets }));
}

test('disabled unless GRID_RULES_API_BASE_URL set; trailing slash trimmed', () => {
  assert.equal(httpSinkEnabled(loadSettings({})), false);
  const s = loadSettings({ GRID_RULES_API_BASE_URL: 'http://pulse-api:3000/', GRID_RULES_API_KEY: 'k' });
  assert.equal(httpSinkEnabled(s), true);
  assert.equal(s.apiSink.baseUrl, 'http://pulse-api:3000');
});

test('posts findings then alerts with api key; alert gets finding tenant', async () => {
  const settings = loadSettings({ GRID_RULES_API_BASE_URL: 'http://api:3000', GRID_RULES_API_KEY: 'dev-key' });
  const recs = await emitted(settings);
  const calls: Array<{ url: string; headers: Record<string, string>; body: any }> = [];
  const sink = new HttpSink(settings, async (url, init) => {
    calls.push({ url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) });
    return { ok: true, status: 201, text: async () => '{}' };
  });
  const r = await sink.post(recs);
  assert.equal(r.failed, 0);
  assert.equal(r.posted, recs.length);
  const urls = new Set(calls.map((c) => c.url));
  assert.deepEqual([...urls].sort(), ['http://api:3000/api/v1/alerts', 'http://api:3000/api/v1/findings']);
  assert.ok(calls.every((c) => c.headers['x-api-key'] === 'dev-key'));
  const f = calls.find((c) => c.url.endsWith('/findings'))!.body;
  assert.ok(f.id && f.utility_id && f.class_id && typeof f.risk_score === 'number');
  const a = calls.find((c) => c.url.endsWith('/alerts'))!.body;
  assert.ok(a.finding_id && a.utility_id && a.sla_due_at);
});

test('http failures (500, network error, missing tenant) are logged + counted, never thrown', async () => {
  const settings = loadSettings({ GRID_RULES_API_BASE_URL: 'http://api:3000' });
  const recs = await emitted(settings);
  const errs: string[] = [];
  const orig = console.error;
  console.error = (m: string) => void errs.push(String(m));
  try {
    let n = 0;
    const sink = new HttpSink(settings, async () => {
      if (n++ % 2) throw new Error('ECONNREFUSED');
      return { ok: false, status: 500, text: async () => 'boom' };
    });
    const r = await sink.post(recs);
    assert.equal(r.posted, 0);
    assert.equal(r.failed, recs.length);
    assert.ok(errs.some((e) => e.includes('500')) && errs.some((e) => e.includes('ECONNREFUSED')));

    const noTenant = recs.map((x) => ('finding' in x.payload ? { ...x, payload: { ...x.payload, utility_id: undefined } } : x));
    const r2 = await new HttpSink(settings, async () => ({ ok: true, status: 201, text: async () => '' })).post(
      noTenant.filter((x) => 'finding' in x.payload),
    );
    assert.equal(r2.failed, noTenant.filter((x) => 'finding' in x.payload).length);
  } finally {
    console.error = orig;
  }
});

test('loop: posts to a real HTTP server; dead API does not stop the loop', async () => {
  const { createServer } = await import('node:http');
  const { mkdtemp } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { startLoop } = await import('../src/loop.js');
  const got: Array<{ url?: string; key?: string }> = [];
  const srv = createServer((req, res) => {
    req.resume();
    got.push({ url: req.url, key: req.headers['x-api-key'] as string });
    res.writeHead(201, { 'content-type': 'application/json' }).end('{"id":"x"}');
  });
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', r));
  const port = (srv.address() as { port: number }).port;
  const raw = (await readFile(`${fixtures}synthetic-detect.v1.json`, 'utf8')).replace(/\s*\n\s*/g, ' ');
  const dir = await mkdtemp(join(tmpdir(), 'gr-http-'));
  const base = { GRID_RULES_ASSETS_FILE: `${fixtures}assets.json`, GRID_RULES_API_KEY: 'k1' };

  const loop = await startLoop(loadSettings({ ...base, GRID_RULES_API_BASE_URL: `http://127.0.0.1:${port}` }));
  try {
    await loop.handleRaw(raw);
    assert.equal(loop.stats.outputs.http, true);
    assert.equal(loop.stats.http.failed, 0);
    assert.equal(loop.stats.http.posted, loop.stats.findings + loop.stats.alerts);
    assert.ok(got.every((g) => g.key === 'k1'));
  } finally {
    await loop.stop();
    srv.close();
  }

  // API down (port closed): handleRaw still resolves, counts failures, file out intact.
  const down = await startLoop(
    loadSettings({ ...base, GRID_RULES_API_BASE_URL: `http://127.0.0.1:${port}`, GRID_RULES_OUT_DIR: dir }),
  );
  const orig = console.error;
  console.error = () => {};
  try {
    await down.handleRaw(raw);
    await down.handleRaw(raw);
  } finally {
    console.error = orig;
    await down.stop();
  }
  assert.equal(down.stats.detects, 2);
  assert.equal(down.stats.http.posted, 0);
  assert.equal(down.stats.http.failed, down.stats.findings + down.stats.alerts);
  assert.ok((await readFile(join(dir, 'vp.findings.v1.jsonl'), 'utf8')).length > 0);
});
