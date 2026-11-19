import { criticalityRank, severityRank } from './rank.js';
import type { BoardItem, BoardSortOptions } from './types.js';

/**
 * Compare two board rows for C09 ranking.
 * Primary: risk_score desc → optional SLA breach → severity → criticality → occurred_at desc → id.
 */
export function compareBoardItems(
  a: BoardItem,
  b: BoardItem,
  options: BoardSortOptions = {},
): number {
  const preferSla = options.prefer_sla_breach !== false;

  if (b.risk_score !== a.risk_score) {
    return b.risk_score - a.risk_score;
  }

  if (preferSla) {
    const aBreach = a.sla_breached ? 1 : 0;
    const bBreach = b.sla_breached ? 1 : 0;
    if (bBreach !== aBreach) return bBreach - aBreach;
  }

  const sev = severityRank(b.severity) - severityRank(a.severity);
  if (sev !== 0) return sev;

  const crit = criticalityRank(b.criticality) - criticalityRank(a.criticality);
  if (crit !== 0) return crit;

  const aTime = a.occurred_at ?? '';
  const bTime = b.occurred_at ?? '';
  if (aTime !== bTime) {
    return bTime < aTime ? -1 : 1;
  }

  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Stable-ish sort: copy then compare (does not mutate input). */
export function sortBoardItems<T extends BoardItem>(
  items: readonly T[],
  options?: BoardSortOptions,
): T[] {
  return items.slice().sort((a, b) => compareBoardItems(a, b, options));
}
