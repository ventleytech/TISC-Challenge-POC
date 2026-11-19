import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { buildEvidenceKey } from '../src/evidence-id.js';
import { LegalHoldError } from '../src/legal-hold.js';
import { MetaIndex } from '../src/object-meta.js';
import { resolveTier } from '../src/retention-policy.js';
import { RetentionStore } from '../src/retention-store.js';
import { FsObjectStore } from '../src/fs-store.js';

describe('resolveTier', () => {
  const policy = { hotDays: 30, warmDays: 365 };
  const t0 = new Date('2026-01-01T00:00:00Z');

  it('hot → warm → expire by age', () => {
    assert.equal(resolveTier(t0, policy, new Date('2026-01-15T00:00:00Z')), 'hot');
    assert.equal(resolveTier(t0, policy, new Date('2026-03-01T00:00:00Z')), 'warm');
    assert.equal(resolveTier(t0, policy, new Date('2027-02-01T00:00:00Z')), 'expire');
  });
});

describe('RetentionStore legal hold', () => {
  it('blocks delete while hold set; allows after clear', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pulse-ret-'));
    const store = new FsObjectStore(root, 'voltpulse-evidence');
    const meta = new MetaIndex(path.join(root, '.retention-meta.json'));
    const ret = new RetentionStore(store, meta, { hotDays: 7, warmDays: 30 });

    const body = Buffer.from('hold-me');
    const key = buildEvidenceKey('util_h', 'hold1', body, 'bin');
    await ret.put(key, body);
    await ret.setLegalHold(key, true);

    await assert.rejects(() => ret.delete(key), (err: unknown) => {
      assert.ok(err instanceof LegalHoldError);
      return true;
    });
    assert.equal(await ret.exists(key), true);

    await ret.setLegalHold(key, false);
    await ret.delete(key);
    assert.equal(await ret.exists(key), false);
  });

  it('listExpirable skips held objects', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'pulse-ret-'));
    const store = new FsObjectStore(root, 'voltpulse-evidence');
    const meta = new MetaIndex(path.join(root, '.retention-meta.json'));
    const ret = new RetentionStore(store, meta, { hotDays: 1, warmDays: 2 });

    const old = new Date('2020-01-01T00:00:00Z');
    const bodyA = Buffer.from('a');
    const bodyB = Buffer.from('b');
    const keyA = buildEvidenceKey('u', 'e1', bodyA, 'txt');
    const keyB = buildEvidenceKey('u', 'e2', bodyB, 'txt');
    await ret.put(keyA, bodyA, undefined, { createdAt: old });
    await ret.put(keyB, bodyB, undefined, { createdAt: old, legalHold: true });

    const expirable = await ret.listExpirable(new Date('2026-01-01T00:00:00Z'));
    assert.deepEqual(expirable, [keyA]);
  });
});
