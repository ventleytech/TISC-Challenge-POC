import type { Criticality, Severity } from "../types/domain";
import { CRITICALITIES, SEVERITIES } from "../types/domain";

/** Higher = more severe (critical=4 … info=0). */
export function severityRank(s: Severity): number {
  const i = SEVERITIES.indexOf(s);
  if (i < 0) return 0;
  return SEVERITIES.length - 1 - i;
}

/** Higher = more critical (critical=3 … low=0). */
export function criticalityRank(c: Criticality): number {
  const i = CRITICALITIES.indexOf(c);
  if (i < 0) return 0;
  return CRITICALITIES.length - 1 - i;
}

/**
 * W01 stub: severity-weighted × criticality → 0–100.
 * Primary: severity ladder; secondary: asset criticality.
 * Real scoring stays in grid-rules; UI mock only.
 */
export function riskScore(severity: Severity, criticality: Criticality): number {
  const sevMax = SEVERITIES.length - 1; // 4
  const critMax = CRITICALITIES.length - 1; // 3
  const max = sevMax * 10 + critMax; // 43
  const raw = severityRank(severity) * 10 + criticalityRank(criticality);
  return Math.round((raw / max) * 100);
}
