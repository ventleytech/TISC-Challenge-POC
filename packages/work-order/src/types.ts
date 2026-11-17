/** Aligns with packages/contracts enums/detection.json */

export const DETECTION_CLASSES = [
  'crack',
  'sag',
  'corrosion',
  'vegetation',
  'thermal_hotspot',
] as const;
export type DetectionClass = (typeof DETECTION_CLASSES)[number];

/** Aligns with packages/contracts enums/severity.json */
export const SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
] as const;
export type Severity = (typeof SEVERITIES)[number];

/**
 * A04 party_type values (caller-supplied; same vocabulary as
 * @voltpulse/responsibility when that package is available).
 */
export const PARTY_TYPES = [
  'oem',
  'installer',
  'epc',
  'maintenance_contractor',
  'vegetation_contractor',
  'utility',
  'unknown',
] as const;
export type PartyType = (typeof PARTY_TYPES)[number];

/** Stable CSV / JSON column order for A07 export rows. */
export const WORK_ORDER_COLUMNS = [
  'work_order_id',
  'finding_id',
  'inspection_id',
  'asset_id',
  'asset_name',
  'utility_id',
  'class_id',
  'severity',
  'risk_score',
  'criticality',
  'voltage_class',
  'party_type',
  'warranty_hint',
  'tender_ref',
  'oem',
  'recommendation',
  'exported_at',
] as const;
export type WorkOrderColumn = (typeof WORK_ORDER_COLUMNS)[number];

export type FindingInput = {
  finding_id: string;
  inspection_id?: string | null;
  class_id: DetectionClass;
  severity: Severity;
  risk_score?: number | null;
  asset_id?: string | null;
  /** Optional free-text action; otherwise derived from class_id. */
  recommendation?: string | null;
};

export type AssetInput = {
  id: string;
  name: string;
  utility_id?: string | null;
  criticality?: string | null;
  voltage_class?: string | null;
  oem?: string | null;
};

/** Party hint from A04–A06 (or synthetic caller). */
export type PartyHintInput = {
  party_type: PartyType;
  warranty_hint?: string | null;
  tender_ref?: string | null;
};

export type WorkOrderRow = {
  work_order_id: string;
  finding_id: string;
  inspection_id: string;
  asset_id: string;
  asset_name: string;
  utility_id: string;
  class_id: DetectionClass;
  severity: Severity;
  risk_score: string;
  criticality: string;
  voltage_class: string;
  party_type: PartyType;
  warranty_hint: string;
  tender_ref: string;
  oem: string;
  recommendation: string;
  exported_at: string;
};

export type WorkOrderSource = {
  finding: FindingInput;
  asset: AssetInput | null | undefined;
  partyHint: PartyHintInput;
};

export type BuildWorkOrderOptions = {
  /** ISO date-time for exported_at. Defaults to now. */
  exportedAt?: string | null;
  /** Prefix for work_order_id. Default `wo`. */
  idPrefix?: string;
};

export type WorkOrderExport = {
  rows: WorkOrderRow[];
  csv: string;
  json: string;
};
