import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_ALERT_POLICY } from '../src/defaults.js';
import {
  isSlaBreached,
  slaDueAt,
  slaDurationMs,
  slaMinutesForSeverity,
} from '../src/sla.js';

describe('sla helpers', () => {
  it('maps severity to Demo Day minute defaults', () => {
    const p = DEFAULT_ALERT_POLICY;
    assert.equal(slaMinutesForSeverity(p, 'critical'), 15);
    assert.equal(slaMinutesForSeverity(p, 'high'), 60);
    assert.equal(slaMinutesForSeverity(p, 'medium'), 240);
    assert.equal(slaMinutesForSeverity(p, 'low'), 1440);
    assert.equal(slaMinutesForSeverity(p, 'info'), 10080);
    assert.equal(slaDurationMs(p, 'critical'), 15 * 60_000);
  });

  it('computes sla_due_at from occurred_at', () => {
    const due = slaDueAt('2026-11-18T00:00:00.000Z', 'critical', DEFAULT_ALERT_POLICY);
    assert.equal(due, '2026-11-18T00:15:00.000Z');
    const high = slaDueAt('2026-11-18T00:00:00.000Z', 'high', DEFAULT_ALERT_POLICY);
    assert.equal(high, '2026-11-18T01:00:00.000Z');
  });

  it('detects breach after due', () => {
    const due = '2026-11-18T00:15:00.000Z';
    assert.equal(isSlaBreached(due, new Date('2026-11-18T00:14:59.000Z')), false);
    assert.equal(isSlaBreached(due, new Date('2026-11-18T00:15:00.000Z')), true);
  });

  it('rejects bad inputs', () => {
    assert.throws(() => slaDueAt('not-a-date', 'high', DEFAULT_ALERT_POLICY), /Invalid occurred_at/);
    assert.throws(
      () => slaMinutesForSeverity(DEFAULT_ALERT_POLICY, 'urgent' as never),
      /Unknown severity/,
    );
  });
});
