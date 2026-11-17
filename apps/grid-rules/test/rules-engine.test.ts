import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MemorySink } from '../src/bus/memory-sink.js';
import { loadSettings } from '../src/config/settings.js';
import { processDetectEvent } from '../src/rules-engine.js';
import type { AssetContext, VpDetectV1 } from '../src/types.js';

const DETECT: VpDetectV1 = {
  event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  occurred_at: '2026-11-18T00:00:00.000Z',
  inspection_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  asset_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  source: 'upload',
  detections: [
    {
      detection_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      class_id: 'corrosion',
      confidence: 0.91,
      evidence_object_id: 'ev/corrosion-01',
    },
    {
      detection_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      class_id: 'vegetation',
      confidence: 0.4,
      evidence_object_id: 'ev/veg-01',
    },
    {
      detection_id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      class_id: 'thermal_hotspot',
      confidence: 0.96,
      evidence_object_id: 'ev/thermal-01',
    },
  ],
};

describe('processDetectEvent', () => {
  it('emits findings with severity + risk_score sorted desc', () => {
    const settings = loadSettings({});
    const assets: Record<string, AssetContext> = {
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc': {
        asset_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        criticality: 'high',
        voltage_class: '132kV HV',
        utility_id: '11111111-1111-4111-8111-111111111111',
      },
    };
    let n = 0;
    const result = processDetectEvent(DETECT, {
      settings,
      assets,
      idFactory: () => {
        n += 1;
        return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
      },
    });

    assert.equal(result.findings.length, 3);
    assert.ok(
      result.findings.every(
        (f) =>
          typeof f.finding.severity === 'string' &&
          typeof f.finding.risk_score === 'number',
      ),
    );
    for (let i = 1; i < result.findings.length; i++) {
      assert.ok(
        result.findings[i - 1]!.finding.risk_score >=
          result.findings[i]!.finding.risk_score,
      );
    }
    const top = result.findings[0]!.finding;
    assert.equal(top.class_id, 'thermal_hotspot');
    assert.ok(['critical', 'high'].includes(top.severity));
  });

  it('emits alerts with sla_due_at for severities ≥ medium', () => {
    const settings = loadSettings({
      GRID_RULES_SLA_CRITICAL_MIN: '15',
      GRID_RULES_SLA_HIGH_MIN: '60',
      GRID_RULES_SLA_MEDIUM_MIN: '240',
    });
    const result = processDetectEvent(DETECT, {
      settings,
      assets: {
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc': {
          asset_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          criticality: 'high',
          utility_id: '11111111-1111-4111-8111-111111111111',
        },
      },
    });

    assert.ok(result.alerts.length >= 1);
    for (const a of result.alerts) {
      assert.ok(a.alert.sla_due_at);
      assert.ok(Date.parse(a.alert.sla_due_at) > Date.parse(DETECT.occurred_at));
      assert.ok(a.alert.channels?.includes('push'));
      assert.equal(a.alert.inspection_id, DETECT.inspection_id);
    }

    const sink = new MemorySink(settings);
    const emitted = sink.emit(result);
    assert.ok(emitted.some((e) => e.topic === 'vp.findings.v1'));
    assert.ok(emitted.some((e) => e.topic === 'vp.alerts.v1'));
  });

  it('criticality changes risk ordering (W01)', () => {
    const settings = loadSettings({});
    const baseDetect: VpDetectV1 = {
      ...DETECT,
      detections: [
        {
          detection_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          class_id: 'corrosion',
          confidence: 0.9,
        },
      ],
    };
    const low = processDetectEvent(baseDetect, {
      settings,
      assets: {
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc': {
          asset_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          criticality: 'low',
        },
      },
    });
    const high = processDetectEvent(baseDetect, {
      settings,
      assets: {
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc': {
          asset_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          criticality: 'critical',
        },
      },
    });
    assert.ok(
      high.findings[0]!.finding.risk_score >
        low.findings[0]!.finding.risk_score,
    );
  });
});
