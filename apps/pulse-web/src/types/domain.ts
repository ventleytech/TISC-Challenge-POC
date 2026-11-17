/** Local UI types aligned with pulse-api OpenAPI stubs (web mock only). */

export const INSPECTION_STATUSES = [
  "planned",
  "in_progress",
  "processing",
  "review",
  "closed",
  "cancelled",
] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const CRITICALITIES = ["critical", "high", "medium", "low"] as const;
export type Criticality = (typeof CRITICALITIES)[number];

/** S8 schedule wizard asset kinds */
export const SCHEDULE_KINDS = ["line", "feeder", "substation"] as const;
export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];

/** A01 registry kinds (wizard kinds + tower/span stubs) */
export const ASSET_KINDS = [
  "line",
  "feeder",
  "substation",
  "tower",
  "span",
] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export type Asset = {
  id: string;
  utility_id: string;
  name: string;
  kind: AssetKind;
  criticality?: Criticality;
  voltage_class?: string | null;
  parent_id?: string | null;
};

export type Inspection = {
  id: string;
  utility_id: string;
  status: InspectionStatus;
  asset_ids: string[];
  schedule_kind?: ScheduleKind | null;
  planned_at?: string | null;
};

export type InspectionCreate = {
  utility_id: string;
  asset_ids?: string[];
  schedule_kind?: ScheduleKind;
  planned_at?: string | null;
};

/** Aligns with packages/contracts/enums/severity.json */
export const SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
] as const;
export type Severity = (typeof SEVERITIES)[number];

export const DETECTION_CLASSES = [
  "crack",
  "sag",
  "corrosion",
  "vegetation",
  "thermal_hotspot",
] as const;
export type DetectionClass = (typeof DETECTION_CLASSES)[number];

/** C09 board row — risk_score from W01 severity × criticality stub. */
export type Finding = {
  id: string;
  utility_id: string;
  asset_id: string;
  class_id: DetectionClass;
  severity: Severity;
  criticality: Criticality;
  risk_score: number;
  recommendation: string;
  occurred_at: string;
};

/** C07 alert row — SLA + ack stub (OpenAPI Alert shape + UI fields). */
export type Alert = {
  id: string;
  utility_id: string;
  finding_id: string;
  inspection_id?: string | null;
  severity: Severity;
  title: string;
  sla_due_at: string | null;
  ack_at: string | null;
};
