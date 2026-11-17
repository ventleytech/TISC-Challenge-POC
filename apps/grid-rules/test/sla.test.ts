import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_ALERT_POLICY } from '@voltpulse/alert-policy';
import { loadSettings } from '../src/config/settings.js';
import { slaDueAt } from '../src/policy/sla.js';

describe('slaDueAt (via alert-policy)', () => {
  it('uses package default critical minutes (15)', () => {
    const settings = loadSettings({});
    assert.equal(
      settings.slaMinutes.critical,
      DEFAULT_ALERT_POLICY.slaMinutes.critical,
    );
    const due = slaDueAt('2026-11-18T00:00:00.000Z', 'critical', settings);
    assert.equal(due, '2026-11-18T00:15:00.000Z');
  });

  it('honors VP_ALERT_SLA_* overlay', () => {
    const settings = loadSettings({ VP_ALERT_SLA_HIGH_MIN: '90' });
    const due = slaDueAt('2026-11-18T00:00:00.000Z', 'high', settings);
    assert.equal(due, '2026-11-18T01:30:00.000Z');
  });

  it('maps legacy GRID_RULES_SLA_* when VP_ALERT unset', () => {
    const settings = loadSettings({ GRID_RULES_SLA_HIGH_MIN: '60' });
    const due = slaDueAt('2026-11-18T00:00:00.000Z', 'high', settings);
    assert.equal(due, '2026-11-18T01:00:00.000Z');
  });
});
