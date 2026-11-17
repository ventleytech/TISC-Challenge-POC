import { randomUUID } from 'node:crypto';
import type { Settings } from './config/settings.js';
import { computeRiskScore } from './policy/risk.js';
import { severityAtLeast, severityFromDetection } from './policy/severity.js';
import { slaDueAt } from './policy/sla.js';
import type {
  AssetContext,
  Criticality,
  RulesEmit,
  Severity,
  VpDetectV1,
} from './types.js';

export type ProcessOptions = {
  settings: Settings;
  /** Lookup by asset_id; falls back to settings.defaultCriticality. */
  assets?: Map<string, AssetContext> | Record<string, AssetContext>;
  nowIso?: string;
  idFactory?: () => string;
};

function resolveAsset(
  assetId: string | null | undefined,
  assets: ProcessOptions['assets'],
): AssetContext | undefined {
  if (!assetId || !assets) return undefined;
  if (assets instanceof Map) return assets.get(assetId);
  return assets[assetId];
}

/**
 * Consume one vp.detect.v1 batch → findings + alerts (contract-shaped).
 */
export function processDetectEvent(
  detect: VpDetectV1,
  opts: ProcessOptions,
): RulesEmit {
  const id = opts.idFactory ?? (() => randomUUID());
  const occurredAt = opts.nowIso ?? detect.occurred_at;
  const findings: RulesEmit['findings'] = [];
  const alerts: RulesEmit['alerts'] = [];

  const minAlert = opts.settings.alertMinSeverity as Severity;

  for (const d of detect.detections) {
    const severity = severityFromDetection(d);
    const asset = resolveAsset(detect.asset_id, opts.assets);
    const criticality: Criticality =
      asset?.criticality ?? opts.settings.defaultCriticality;
    const risk_score = computeRiskScore({
      severity,
      confidence: d.confidence,
      criticality,
      voltageClass: asset?.voltage_class,
    });

    const finding_id = id();
    const evidence =
      d.evidence_object_id != null && d.evidence_object_id !== ''
        ? [d.evidence_object_id]
        : [];

    findings.push({
      event_id: id(),
      occurred_at: occurredAt,
      inspection_id: detect.inspection_id,
      finding: {
        finding_id,
        class_id: d.class_id,
        severity,
        risk_score,
        asset_id: detect.asset_id ?? null,
        source_detection_ids: [d.detection_id],
        evidence_object_ids: evidence,
      },
    });

    if (severityAtLeast(severity, minAlert)) {
      alerts.push({
        event_id: id(),
        occurred_at: occurredAt,
        alert: {
          alert_id: id(),
          finding_id,
          inspection_id: detect.inspection_id,
          utility_id: asset?.utility_id,
          severity,
          sla_due_at: slaDueAt(occurredAt, severity, opts.settings),
          channels: [...opts.settings.defaultChannels],
        },
      });
    }
  }

  findings.sort((a, b) => b.finding.risk_score - a.finding.risk_score);
  return { findings, alerts };
}
