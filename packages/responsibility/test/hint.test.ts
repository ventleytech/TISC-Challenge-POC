import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DETECTION_CLASSES,
  hintResponsibility,
  isWithinWarranty,
  PARTY_TYPES,
  WARRANTY_HINTS,
} from '../src/index.js';

const AS_OF = '2026-06-15T12:00:00.000Z';

describe('enums align with VoltPulse detection ids', () => {
  it('exports five detection classes', () => {
    assert.deepEqual([...DETECTION_CLASSES], [
      'crack',
      'sag',
      'corrosion',
      'vegetation',
      'thermal_hotspot',
    ]);
  });

  it('exports party_type and warranty_hint enums', () => {
    assert.ok(PARTY_TYPES.includes('oem'));
    assert.ok(WARRANTY_HINTS.includes('warranty_breach_suspect'));
  });
});

describe('hintResponsibility — A04 party / A06 warranty', () => {
  it('corrosion in warranty → oem + warranty_breach_suspect', () => {
    const hint = hintResponsibility({
      class_id: 'corrosion',
      asOf: AS_OF,
      asset: {
        oem: 'DemoTowerCo',
        warranty_end: '2027-01-01',
        install_date: '2024-01-01',
      },
    });
    assert.equal(hint.party_type, 'oem');
    assert.equal(hint.warranty_hint, 'warranty_breach_suspect');
    assert.equal(hint.tender_ref, null);
  });

  it('corrosion with SLA only (no warranty_end) → oem + sla_active', () => {
    const hint = hintResponsibility({
      class_id: 'corrosion',
      asOf: AS_OF,
      asset: {
        anti_corrosion_sla_end: '2026-12-31',
      },
    });
    assert.equal(hint.party_type, 'oem');
    assert.equal(hint.warranty_hint, 'sla_active');
  });

  it('corrosion after warranty → maintenance_contractor + warranty_expired', () => {
    const hint = hintResponsibility({
      class_id: 'corrosion',
      asOf: AS_OF,
      asset: {
        warranty_end: '2025-01-01',
      },
    });
    assert.equal(hint.party_type, 'maintenance_contractor');
    assert.equal(hint.warranty_hint, 'warranty_expired');
  });

  it('vegetation → vegetation_contractor regardless of warranty', () => {
    const hint = hintResponsibility({
      class_id: 'vegetation',
      asOf: AS_OF,
      asset: {
        warranty_end: '2030-01-01',
      },
    });
    assert.equal(hint.party_type, 'vegetation_contractor');
    // vegetation not OEM-covered → in_warranty (not breach_suspect)
    assert.equal(hint.warranty_hint, 'in_warranty');
  });

  it('sag in warranty → installer + in_warranty', () => {
    const hint = hintResponsibility({
      class_id: 'sag',
      asOf: AS_OF,
      asset: { warranty_end: '2028-06-01' },
    });
    assert.equal(hint.party_type, 'installer');
    assert.equal(hint.warranty_hint, 'in_warranty');
  });

  it('crack with no dates → utility + no_warranty_data', () => {
    const hint = hintResponsibility({
      class_id: 'crack',
      asOf: AS_OF,
      asset: {},
    });
    assert.equal(hint.party_type, 'utility');
    assert.equal(hint.warranty_hint, 'no_warranty_data');
  });

  it('thermal_hotspot in warranty → oem + warranty_breach_suspect', () => {
    const hint = hintResponsibility({
      class_id: 'thermal_hotspot',
      asOf: AS_OF,
      asset: { warranty_end: '2027-06-15' },
    });
    assert.equal(hint.party_type, 'oem');
    assert.equal(hint.warranty_hint, 'warranty_breach_suspect');
  });
});

describe('hintResponsibility — A05 tender_ref', () => {
  it('passthrough tender_ref when present', () => {
    const hint = hintResponsibility({
      class_id: 'crack',
      asOf: AS_OF,
      asset: {
        warranty_end: '2025-01-01',
        tender_ref: 'VP-TENDER-DEMO-42',
      },
    });
    assert.equal(hint.tender_ref, 'VP-TENDER-DEMO-42');
    assert.equal(hint.party_type, 'utility');
  });

  it('empty tender_ref becomes null', () => {
    const hint = hintResponsibility({
      class_id: 'crack',
      asOf: AS_OF,
      asset: { tender_ref: '' },
    });
    assert.equal(hint.tender_ref, null);
  });
});

describe('isWithinWarranty', () => {
  it('true / false / null', () => {
    const asOf = new Date(AS_OF);
    assert.equal(isWithinWarranty({ warranty_end: '2027-01-01' }, asOf), true);
    assert.equal(isWithinWarranty({ warranty_end: '2020-01-01' }, asOf), false);
    assert.equal(isWithinWarranty({}, asOf), null);
  });

  it('throws on invalid date', () => {
    assert.throws(
      () => isWithinWarranty({ warranty_end: 'not-a-date' }, new Date(AS_OF)),
      /Invalid date/,
    );
  });
});
