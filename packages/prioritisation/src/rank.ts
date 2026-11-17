import { CRITICALITIES, SEVERITIES, type Criticality, type Severity } from './types.js';

/** Higher = more severe (critical=4 … info=0). Matches grid-rules ORDER index. */
export function severityRank(s: Severity): number {
  const i = SEVERITIES.indexOf(s);
  if (i < 0) return -1;
  // SEVERITIES listed critical→info; invert so critical ranks highest.
  return SEVERITIES.length - 1 - i;
}

/** Higher = more critical. */
export function criticalityRank(c: Criticality): number {
  const i = CRITICALITIES.indexOf(c);
  if (i < 0) return -1;
  return CRITICALITIES.length - 1 - i;
}
