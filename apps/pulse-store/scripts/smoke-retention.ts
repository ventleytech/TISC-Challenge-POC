/**
 * Proof: legal hold blocks delete; expire candidates honor hold + TTL env.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadSettings } from '../src/config.js';
import { createRetentionStore } from '../src/create-store.js';
import { buildEvidenceKey } from '../src/evidence-id.js';
import { LegalHoldError } from '../src/legal-hold.js';

async function main(): Promise<void> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'pulse-store-ret-smoke-'));
  const settings = loadSettings({
    ...process.env,
    PULSE_STORE_BACKEND: 'fs',
    PULSE_STORE_FS_ROOT: tmp,
    // short windows for smoke readability; still use env-driven policy
    PULSE_STORE_HOT_DAYS: process.env.PULSE_STORE_HOT_DAYS ?? '1',
    PULSE_STORE_WARM_DAYS: process.env.PULSE_STORE_WARM_DAYS ?? '2',
  });

  const ret = createRetentionStore(settings);
  console.log(
    `[info] retention hotDays=${settings.hotDays} warmDays=${settings.warmDays} fsRoot=${settings.fsRoot}`,
  );

  const body = Buffer.from(`retention-smoke-${Date.now()}`);
  const key = buildEvidenceKey('util_ret', 'ret001', body, 'txt');
  await ret.put(key, body, 'text/plain', {
    createdAt: new Date('2020-01-01T00:00:00Z'),
  });

  const st = await ret.status(key, new Date('2026-11-18T00:00:00Z'));
  console.log(`[ok] status tier=${st.tier} legalHold=${st.legalHold} key=${key}`);
  if (st.tier !== 'expire') {
    throw new Error(`expected expire tier for aged object, got ${st.tier}`);
  }

  await ret.setLegalHold(key, true);
  let blocked = false;
  try {
    await ret.delete(key);
  } catch (err) {
    if (err instanceof LegalHoldError) {
      blocked = true;
      console.log(`[ok] legal hold blocked delete: ${err.message}`);
    } else {
      throw err;
    }
  }
  if (!blocked) throw new Error('expected LegalHoldError on delete');

  const expWhileHeld = await ret.listExpirable(new Date('2026-11-18T00:00:00Z'));
  if (expWhileHeld.includes(key)) {
    throw new Error('held object must not appear in listExpirable');
  }
  console.log(`[ok] listExpirable excludes held key (count=${expWhileHeld.length})`);

  await ret.setLegalHold(key, false);
  const exp = await ret.listExpirable(new Date('2026-11-18T00:00:00Z'));
  if (!exp.includes(key)) {
    throw new Error('cleared object should be expirable');
  }
  await ret.delete(key);
  console.log(`[ok] delete after hold clear key=${key}`);
  console.log('[ok] pulse-store retention/hold smoke complete');
}

main().catch((err) => {
  console.error('[fail]', err);
  process.exitCode = 1;
});
