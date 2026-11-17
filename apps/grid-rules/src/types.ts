/** Aligns with packages/contracts enums + vp.* event stubs. */

export const DETECTION_CLASSES = [
  'crack',
  'sag',
  'corrosion',
  'vegetation',
  'thermal_hotspot',
] as const;
export type DetectionClass = (typeof DETECTION_CLASSES)[number];

export const SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
] as const;
export type Severity = (typeof SEVERITIES)[number];

export const CRITICALITIES = ['critical', 'high', 'medium', 'low'] as const;
export type Criticality = (typeof CRITICALITIES)[number];

export const ALERT_CHANNELS = ['push', 'sms', 'email'] as const;
export type AlertChannel = (typeof ALERT_CHANNELS)[number];

export type DetectionItem = {
  detection_id: string;
  class_id: DetectionClass;
  confidence: number;
  bbox?: number[];
  evidence_object_id?: string | null;
};

export type VpDetectV1 = {
  event_id: string;
  occurred_at: string;
  inspection_id: string;
  asset_id?: string | null;
  source?: 'live' | 'upload' | 'thermal_media';
  detections: DetectionItem[];
};

/** S9 / A04–A06 hints nested under finding.extensions (contract-additive). */
export type FindingResponsibilityExtensions = {
  party_type: string;
  warranty_hint: string;
  tender_ref?: string | null;
};

export type FindingPayload = {
  finding_id: string;
  class_id: DetectionClass;
  severity: Severity;
  risk_score: number;
  asset_id?: string | null;
  source_detection_ids?: string[];
  evidence_object_ids?: string[];
  /** Optional bag — party_type / warranty_hint when OEM/warranty on asset. */
  extensions?: FindingResponsibilityExtensions & Record<string, unknown>;
};

export type VpFindingsV1 = {
  event_id: string;
  occurred_at: string;
  inspection_id: string;
  finding: FindingPayload;
};

export type AlertPayload = {
  alert_id: string;
  finding_id: string;
  inspection_id?: string;
  utility_id?: string;
  severity: Severity;
  sla_due_at: string;
  channels?: AlertChannel[];
};

export type VpAlertsV1 = {
  event_id: string;
  occurred_at: string;
  alert: AlertPayload;
};

/** Optional asset context for W01 (severity × criticality × confidence) + S9. */
export type AssetContext = {
  asset_id: string;
  criticality: Criticality;
  voltage_class?: string | null;
  utility_id?: string;
  /** A02 OEM / warranty fields — when present, rules attach S9 hints. */
  oem?: string | null;
  install_date?: string | null;
  warranty_end?: string | null;
  anti_corrosion_sla_end?: string | null;
  tender_ref?: string | null;
};

export type RulesEmit = {
  findings: VpFindingsV1[];
  alerts: VpAlertsV1[];
};
