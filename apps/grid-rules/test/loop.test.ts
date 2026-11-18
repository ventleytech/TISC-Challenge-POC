import assert from 'node:assert/strict';
import { appendFile, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { FileTail } from '../src/bus/file-bus.js';
import { loadSettings } from '../src/config/settings.js';
import { startLoop } from '../src/loop.js';

const fixtureDir = new URL('../fixtures/', import.meta.url).pathname;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('FileTail holds partial lines, resets on truncate', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gr-tail-'));
  const f = join(dir, 'a.jsonl');
  const t = new FileTail(f);
  assert.deepEqual(await t.poll(), []); // missing file
  await writeFile(f, '{"a":1}\n{"b"');
  assert.deepEqual(await t.poll(), ['{"a":1}']);
  await appendFile(f, ':2}\n');
  assert.deepEqual(await t.poll(), ['{"b":2}']);
  await writeFile(f, '{"c":3}\n'); // truncated + rewritten
  assert.deepEqual(await t.poll(), ['{"c":3}']);
});

test('loop: detect jsonl in → findings + alerts jsonl out; bad line rejected', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gr-loop-'));
  const detectFile = join(dir, 'vp.detect.v1.jsonl');
  const raw = (await readFile(join(fixtureDir, 'synthetic-detect.v1.json'), 'utf8')).replace(/\s*\n\s*/g, ' ');
  await writeFile(detectFile, `not json\n${raw}\n`);
  const loop = await startLoop(
    loadSettings({
      GRID_RULES_DETECT_FILE: detectFile,
      GRID_RULES_OUT_DIR: dir,
      GRID_RULES_ASSETS_FILE: join(fixtureDir, 'assets.json'),
      GRID_RULES_POLL_MS: '50',
    }),
  );
  try {
    for (let i = 0; i < 40 && loop.stats.detects < 1; i++) await sleep(50);
    assert.equal(loop.stats.detects, 1);
    assert.equal(loop.stats.rejected, 1);
    const lines = async (n: string) =>
      (await readFile(join(dir, n), 'utf8')).trim().split('\n').map((l) => JSON.parse(l));
    const findings = await lines('vp.findings.v1.jsonl');
    const alerts = await lines('vp.alerts.v1.jsonl');
    assert.equal(findings.length, 3);
    assert.ok(alerts.length >= 1 && alerts[0].alert.sla_due_at);
    assert.equal(findings[0].finding.extensions.party_type !== undefined, true); // asset ctx applied
  } finally {
    await loop.stop();
  }
});

test('loop: no inputs configured → idle, no throw', async () => {
  const loop = await startLoop(loadSettings({}));
  assert.deepEqual(loop.stats.inputs, { file: false, kafka: false });
  await loop.stop();
});
