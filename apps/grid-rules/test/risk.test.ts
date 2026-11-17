import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeRiskScore } from '../src/policy/risk.js';

describe('W01 computeRiskScore', () => {
  it('raises risk when criticality increases (same severity/confidence)', () => {
    const lowAsset = computeRiskScore({
      severity: 'high',
      confidence: 0.9,
      criticality: 'low',
    });
    const highAsset = computeRiskScore({
      severity: 'high',
      confidence: 0.9,
      criticality: 'critical',
    });
    assert.ok(highAsset > lowAsset);
  });

  it('raises risk for higher severity', () => {
    const med = computeRiskScore({
      severity: 'medium',
      confidence: 0.9,
      criticality: 'high',
    });
    const crit = computeRiskScore({
      severity: 'critical',
      confidence: 0.9,
      criticality: 'high',
    });
    assert.ok(crit > med);
  });

  it('applies HV voltage bump', () => {
    const base = computeRiskScore({
      severity: 'high',
      confidence: 0.9,
      criticality: 'high',
    });
    const hv = computeRiskScore({
      severity: 'high',
      confidence: 0.9,
      criticality: 'high',
      voltageClass: '132kV HV',
    });
    assert.ok(hv > base);
  });

  it('stays within 0–100', () => {
    const score = computeRiskScore({
      severity: 'critical',
      confidence: 1,
      criticality: 'critical',
      voltageClass: '765kV EHV',
    });
    assert.ok(score >= 0 && score <= 100);
  });
});
