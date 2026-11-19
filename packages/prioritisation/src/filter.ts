import type { BoardFilter, BoardItem } from './types.js';

/** Filter board rows without mutating the input array. */
export function filterBoardItems<T extends BoardItem>(
  items: readonly T[],
  query: BoardFilter = {},
): T[] {
  return items.filter((item) => matches(item, query));
}

function matches(item: BoardItem, q: BoardFilter): boolean {
  if (q.severities && q.severities.length > 0) {
    if (!q.severities.includes(item.severity)) return false;
  }
  if (q.criticalities && q.criticalities.length > 0) {
    if (!q.criticalities.includes(item.criticality)) return false;
  }
  if (q.class_ids && q.class_ids.length > 0) {
    if (!item.class_id || !q.class_ids.includes(item.class_id)) return false;
  }
  if (q.utility_id !== undefined && item.utility_id !== q.utility_id) {
    return false;
  }
  if (q.min_risk !== undefined && item.risk_score < q.min_risk) {
    return false;
  }
  if (q.sla_breached_only && !item.sla_breached) {
    return false;
  }
  return true;
}
