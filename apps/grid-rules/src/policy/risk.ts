import type { Criticality, Severity } from '../types.js';
import { severityRank } from './severity.js';

const CRITICALITY_WEIGHT: Record<Criticality, number> = {
  critical: 1.0,
  high: 0.85,
  medium: 0.6,
  low: 0.35,
};

/** Voltage class bump — HV/EHV raise risk slightly; unknown = 1. */
export function voltageFactor(voltageClass?: string | null): number {
  if (!voltageClass) return 1;
  const v = voltageClass.toLowerCase();
  if (v.includes('ehv') || v.includes('400') || v.includes('765')) return 1.15;
  if (v.includes('hv') || v.includes('132') || v.includes('220')) return 1.08;
  if (v.includes('mv') || v.includes('33') || v.includes('11')) return 1.0;
  return 1;
}

/**
 * W01 risk score: severity × criticality × confidence (× voltage factor).
 * Returns 0–100 sort key (higher = more urgent).
 */
export function computeRiskScore(input: {
  severity: Severity;
  confidence: number;
  criticality: Criticality;
  voltageClass?: string | null;
}): number {
  const sevNorm = (severityRank(input.severity) + 1) / 5; // 0.2 … 1.0
  const crit = CRITICALITY_WEIGHT[input.criticality];
  const conf = Math.min(1, Math.max(0, input.confidence));
  const vf = voltageFactor(input.voltageClass);
  const raw = sevNorm * crit * (0.45 + 0.55 * conf) * vf * 100;
  const clamped = Math.min(100, Math.max(0, raw));
  return Math.round(clamped * 100) / 100;
}
