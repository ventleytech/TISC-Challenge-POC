import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DETECTION_CLASSES,
  PARTY_TYPES,
  SEVERITIES,
  WORK_ORDER_COLUMNS,
  buildWorkOrderRow,
  buildWorkOrderRows,
  csvEscape,
  exportWorkOrders,
  toCsv,
  toJson,
  type FindingInput,
  type AssetInput,
  type PartyHintInput,
} from '../src/index.js';

const finding: FindingInput = {
  finding_id: 'f-11111111-1111-4111-8111-111111111111',
  inspection_id: 'i-22222222-2222-4222-8222-222222222222',
  class_id: 'corrosion',
  severity: 'high',
  risk_score: 0.87,
  asset_id: 'a-33333333-3333-4333-8333-333333333333',
};

const asset: AssetInput = {
  id: 'a-33333333-3333-4333-8333-333333333333',
  name: 'Demo Tower T-01',
  utility_id: 'u-44444444-4444-4444-8444-444444444444',
  criticality: 'critical',
  voltage_class: '132kV',
  oem: 'DemoTowerCo',
};

const partyHint: PartyHintInput = {
  party_type: 'oem',
  warranty_hint: 'warranty_breach_suspect',
  tender_ref: 'VP-TENDER-DEMO-42',
};

const EXPORTED_AT = '2026-11-18T00:00:00.000Z';

describe('enums', () => {
  it('exports five detection classes', () => {
    assert.deepEqual([...DETECTION_CLASSES], [
      'crack',
      'sag',
      'corrosion',
      'vegetation',
      'thermal_hotspot',
    ]);
  });

  it('exports severity + party vocabularies', () => {
    assert.ok(SEVERITIES.includes('critical'));
    assert.ok(PARTY_TYPES.includes('vegetation_contractor'));
    assert.equal(WORK_ORDER_COLUMNS[0], 'work_order_id');
  });
});

describe('buildWorkOrderRow', () => {
  it('maps finding + asset + party hint to a stable row', () => {
    const row = buildWorkOrderRow(finding, asset, partyHint, {
      exportedAt: EXPORTED_AT,
    });
    assert.equal(
      row.work_order_id,
      'wo-f-11111111-1111-4111-8111-111111111111',
    );
    assert.equal(row.finding_id, finding.finding_id);
    assert.equal(row.inspection_id, finding.inspection_id);
    assert.equal(row.asset_id, asset.id);
    assert.equal(row.asset_name, 'Demo Tower T-01');
    assert.equal(row.utility_id, asset.utility_id);
    assert.equal(row.class_id, 'corrosion');
    assert.equal(row.severity, 'high');
    assert.equal(row.risk_score, '0.87');
    assert.equal(row.criticality, 'critical');
    assert.equal(row.voltage_class, '132kV');
    assert.equal(row.party_type, 'oem');
    assert.equal(row.warranty_hint, 'warranty_breach_suspect');
    assert.equal(row.tender_ref, 'VP-TENDER-DEMO-42');
    assert.equal(row.oem, 'DemoTowerCo');
    assert.match(row.recommendation, /OEM\/SLA/);
    assert.equal(row.exported_at, EXPORTED_AT);
  });

  it('allows missing asset / optional hint fields', () => {
    const row = buildWorkOrderRow(
      {
        finding_id: 'f-bare',
        class_id: 'vegetation',
        severity: 'medium',
      },
      null,
      { party_type: 'vegetation_contractor' },
      { exportedAt: EXPORTED_AT },
    );
    assert.equal(row.work_order_id, 'wo-f-bare');
    assert.equal(row.asset_id, '');
    assert.equal(row.asset_name, '');
    assert.equal(row.warranty_hint, '');
    assert.equal(row.tender_ref, '');
    assert.equal(row.risk_score, '');
    assert.match(row.recommendation, /vegetation/i);
  });

  it('uses custom recommendation when provided', () => {
    const row = buildWorkOrderRow(
      { ...finding, recommendation: 'Replace insulator set' },
      asset,
      partyHint,
      { exportedAt: EXPORTED_AT },
    );
    assert.equal(row.recommendation, 'Replace insulator set');
  });

  it('rejects asset id mismatch', () => {
    assert.throws(
      () =>
        buildWorkOrderRow(
          finding,
          { ...asset, id: 'a-other' },
          partyHint,
        ),
      /does not match/,
    );
  });

  it('rejects invalid enums', () => {
    assert.throws(
      () =>
        buildWorkOrderRow(
          { ...finding, class_id: 'rust' as FindingInput['class_id'] },
          asset,
          partyHint,
        ),
      /Invalid class_id/,
    );
    assert.throws(
      () =>
        buildWorkOrderRow(finding, asset, {
          party_type: 'vendor' as PartyHintInput['party_type'],
        }),
      /Invalid party_type/,
    );
  });
});

describe('CSV / JSON export', () => {
  it('escapes CSV cells with commas and quotes', () => {
    assert.equal(csvEscape('plain'), 'plain');
    assert.equal(csvEscape('a,b'), '"a,b"');
    assert.equal(csvEscape('say "hi"'), '"say ""hi"""');
  });

  it('emits header + multi-row CSV', () => {
    const rows = buildWorkOrderRows(
      [
        { finding, asset, partyHint },
        {
          finding: {
            finding_id: 'f-veg',
            class_id: 'vegetation',
            severity: 'low',
            asset_id: asset.id,
          },
          asset,
          partyHint: { party_type: 'vegetation_contractor' },
        },
      ],
      { exportedAt: EXPORTED_AT },
    );
    const csv = toCsv(rows);
    const lines = csv.split('\n');
    assert.equal(lines[0], WORK_ORDER_COLUMNS.join(','));
    assert.equal(lines.length, 3);
    assert.ok(lines[1].includes('corrosion'));
    assert.ok(lines[2].includes('vegetation_contractor'));
    assert.ok(lines[1].includes('"Demo Tower T-01"') === false); // no comma in name
    assert.ok(lines[1].startsWith('wo-f-11111111'));
  });

  it('JSON round-trips and exportWorkOrders returns both encodings', () => {
    const out = exportWorkOrders(
      [{ finding, asset, partyHint }],
      { exportedAt: EXPORTED_AT },
    );
    assert.equal(out.rows.length, 1);
    const parsed = JSON.parse(out.json);
    assert.deepEqual(parsed, out.rows);
    assert.equal(toJson(out.rows, false), JSON.stringify(out.rows));
    assert.ok(out.csv.startsWith(WORK_ORDER_COLUMNS.join(',')));
  });
});
