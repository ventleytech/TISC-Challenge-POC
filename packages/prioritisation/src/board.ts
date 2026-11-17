import { filterBoardItems } from './filter.js';
import { sortBoardItems } from './sort.js';
import type { BoardFilter, BoardItem, BoardSortOptions } from './types.js';

/** C09 pipeline: filter then sort by W01 risk_score (and tie-breakers). */
export function rankBoardItems<T extends BoardItem>(
  items: readonly T[],
  filter: BoardFilter = {},
  sortOptions?: BoardSortOptions,
): T[] {
  return sortBoardItems(filterBoardItems(items, filter), sortOptions);
}
