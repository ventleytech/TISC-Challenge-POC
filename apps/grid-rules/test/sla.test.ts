import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadSettings } from '../src/config/settings.js';
import { slaDueAt } from '../src/policy/sla.js';

describe('slaDueAt', () => {
  it('adds configured minutes for critical', () => {
    const settings = loadSettings({ GRID_RULES_SLA_CRITICAL_MIN: '15' });
    const due = slaDueAt('2026-11-18T00:00:00.000Z', 'critical', settings);
    assert.equal(due, '2026-11-18T00:15:00.000Z');
  });

  it('uses high SLA offset', () => {
    const settings = loadSettings({ GRID_RULES_SLA_HIGH_MIN: '60' });
    const due = slaDueAt('2026-11-18T00:00:00.000Z', 'high', settings);
    assert.equal(due, '2026-11-18T01:00:00.000Z');
  });
});
