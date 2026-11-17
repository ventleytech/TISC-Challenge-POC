import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  compareBoardItems,
  criticalityRank,
  filterBoardItems,
  rankBoardItems,
  severityRank,
  sortBoardItems,
  type BoardItem,
} from '../src/index.js';

const rows: BoardItem[] = [
  {
    id: 'a',
    risk_score: 40,
    severity: 'medium',
    criticality: 'high',
    class_id: 'corrosion',
    utility_id: 'u1',
    occurred_at: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 'b',
    risk_score: 90,
    severity: 'critical',
    criticality: 'critical',
    class_id: 'thermal_hotspot',
    utility_id: 'u1',
    occurred_at: '2026-11-18T09:00:00.000Z',
  },
  {
    id: 'c',
    risk_score: 90,
    severity: 'high',
    criticality: 'high',
    class_id: 'crack',
    utility_id: 'u2',
    occurred_at: '2026-11-18T11:00:00.000Z',
    sla_breached: true,
  },
  {
    id: 'd',
    risk_score: 90,
    severity: 'high',
    criticality: 'high',
    class_id: 'crack',
    utility_id: 'u2',
    occurred_at: '2026-11-18T08:00:00.000Z',
  },
];

describe('severityRank / criticalityRank', () => {
  it('ranks critical above info', () => {
    assert.ok(severityRank('critical') > severityRank('info'));
    assert.ok(criticalityRank('critical') > criticalityRank('low'));
  });
});

describe('sortBoardItems', () => {
  it('orders by risk_score desc', () => {
    const sorted = sortBoardItems(rows);
    assert.equal(sorted[0]!.id, 'c'); // 90 + sla breach
    assert.equal(sorted[sorted.length - 1]!.id, 'a');
  });

  it('prefers sla_breached on equal risk', () => {
    assert.ok(compareBoardItems(rows[2]!, rows[3]!) < 0); // c before d
  });

  it('does not mutate input', () => {
    const copy = rows.slice();
    sortBoardItems(rows);
    assert.deepEqual(
      rows.map((r) => r.id),
      copy.map((r) => r.id),
    );
  });
});

describe('filterBoardItems', () => {
  it('filters by severity and utility', () => {
    const out = filterBoardItems(rows, {
      severities: ['critical', 'high'],
      utility_id: 'u2',
    });
    assert.deepEqual(
      out.map((r) => r.id).sort(),
      ['c', 'd'],
    );
  });

  it('filters by min_risk and class', () => {
    const out = filterBoardItems(rows, {
      min_risk: 50,
      class_ids: ['thermal_hotspot'],
    });
    assert.equal(out.length, 1);
    assert.equal(out[0]!.id, 'b');
  });

  it('filters sla_breached_only', () => {
    const out = filterBoardItems(rows, { sla_breached_only: true });
    assert.deepEqual(
      out.map((r) => r.id),
      ['c'],
    );
  });
});

describe('rankBoardItems', () => {
  it('filters then sorts', () => {
    const out = rankBoardItems(rows, { utility_id: 'u1' });
    assert.deepEqual(
      out.map((r) => r.id),
      ['b', 'a'],
    );
  });
});
