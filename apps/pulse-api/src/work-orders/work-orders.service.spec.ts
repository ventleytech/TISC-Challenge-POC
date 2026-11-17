import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { MemoryStore } from '../domain/memory.store';

describe('WorkOrdersService', () => {
  let store: MemoryStore;
  let service: WorkOrdersService;

  beforeEach(() => {
    store = new MemoryStore();
    service = new WorkOrdersService(store);
  });

  it('exports JSON rows via @voltpulse/work-order', () => {
    const assetId = store.nextId();
    store.assets.set(assetId, {
      id: assetId,
      utility_id: 'u-1',
      name: 'Tower-A1',
      criticality: 'high',
      voltage_class: '132kV',
    });

    const result = service.exportFromBody({
      utility_id: 'u-1',
      exported_at: '2026-11-18T00:00:00.000Z',
      items: [
        {
          finding: {
            finding_id: 'f-1',
            inspection_id: 'i-1',
            class_id: 'corrosion',
            severity: 'high',
            risk_score: 0.91,
            asset_id: assetId,
          },
          party_hint: {
            party_type: 'oem',
            warranty_hint: 'warranty_breach_suspect',
            tender_ref: 'VP-TENDER-1',
          },
          asset: { oem: 'DemoTowerCo' },
        },
      ],
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      work_order_id: 'wo-f-1',
      finding_id: 'f-1',
      asset_id: assetId,
      asset_name: 'Tower-A1',
      utility_id: 'u-1',
      class_id: 'corrosion',
      severity: 'high',
      party_type: 'oem',
      oem: 'DemoTowerCo',
      exported_at: '2026-11-18T00:00:00.000Z',
    });
    expect(result.csv).toMatch(/^work_order_id,/);
    expect(result.csv).toContain('corrosion');
    expect(JSON.parse(result.json)).toHaveLength(1);
  });

  it('404 when asset_id missing from store', () => {
    expect(() =>
      service.exportFromBody({
        utility_id: 'u-1',
        items: [
          {
            finding: {
              finding_id: 'f-2',
              class_id: 'crack',
              severity: 'medium',
              asset_id: 'missing-asset',
            },
            party_hint: { party_type: 'utility' },
          },
        ],
      }),
    ).toThrow(NotFoundException);
  });

  it('rejects invalid format enums from package', () => {
    expect(() =>
      service.exportFromBody({
        utility_id: 'u-1',
        items: [
          {
            finding: {
              finding_id: 'f-3',
              class_id: 'not-a-class',
              severity: 'high',
            },
            party_hint: { party_type: 'utility' },
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });
});
