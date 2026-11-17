import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_ALERT_POLICY } from '@voltpulse/alert-policy';
import { loadSettings } from '../src/config/settings.js';

describe('loadSettings alert-policy wiring', () => {
  it('defaults slaMinutes + channels from package policy', () => {
    const settings = loadSettings({});
    assert.deepEqual(settings.slaMinutes, DEFAULT_ALERT_POLICY.slaMinutes);
    assert.deepEqual(settings.defaultChannels, ['push', 'sms']);
    assert.equal(settings.alertPolicy.channels.email.enabled, false);
  });

  it('prefers VP_ALERT_SLA_* over legacy GRID_RULES_SLA_*', () => {
    const settings = loadSettings({
      VP_ALERT_SLA_CRITICAL_MIN: '20',
      GRID_RULES_SLA_CRITICAL_MIN: '99',
    });
    assert.equal(settings.slaMinutes.critical, 20);
  });
});
