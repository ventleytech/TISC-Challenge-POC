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
  oem?: string | null;
  install_year?: number | null;
  circuit?: string | null;
  site_id?: string | null;
  warranty_until?: string | null;
  anti_corrosion_sla?: string | null;
};

export const INSPECTION_MODES = ["live_pull", "record_upload"] as const;
export type InspectionMode = (typeof INSPECTION_MODES)[number];

export type Inspection = {
  id: string;
  utility_id: string;
  status: InspectionStatus;
  asset_ids: string[];
  schedule_kind?: ScheduleKind | null;
  planned_at?: string | null;
  assignee?: string | null;
  finding_count?: number;
  sla_hours_left?: number | null;
  mode?: InspectionMode | null;
  site_id?: string | null;
  payload?: "rgb" | "rgb_ir" | null;
  outage_window?: string | null;
  clearance?: string | null;
};

export type InspectionCreate = {
  utility_id: string;
  asset_ids?: string[];
  schedule_kind?: ScheduleKind;
  planned_at?: string | null;
  mode?: InspectionMode;
  payload?: "rgb" | "rgb_ir";
  outage_window?: string | null;
  clearance?: string | null;
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

export type LabelVerdict = "tp" | "fp" | "unlabeled";

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
  inspection_id?: string | null;
  label?: LabelVerdict;
  severity_override?: Severity | null;
  audit_note?: string | null;
  vendor_hint?: string | null;
  warranty_hint?: string | null;
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
  dept_code?: string | null;
  escalated_at?: string | null;
};

export type TaskStatus = "open" | "assigned" | "done";

export type Task = {
  id: string;
  utility_id: string;
  title: string;
  finding_id?: string | null;
  alert_id?: string | null;
  assignee: string;
  due_at: string | null;
  status: TaskStatus;
  created_at: string;
};

export type IncidentStatus = "open" | "mitigating" | "closed";

export type Incident = {
  id: string;
  utility_id: string;
  title: string;
  finding_ids: string[];
  severity: Severity;
  status: IncidentStatus;
  created_at: string;
  dept_code?: string | null;
};

export type AdminUser = {
  id: string;
  name: string;
  role: string;
  dept_code: string;
  utility_id: string;
  api_key_hint: string;
};

export type UtilityRow = {
  id: string;
  name: string;
  created_at?: string;
};

export type EvidenceKind = "crop" | "rgb_frame" | "ir_frame" | "clip" | "report";

export type EvidenceObject = {
  id: string;
  inspection_id: string;
  label: string;
  kind: EvidenceKind;
  retention: "hot" | "warm" | "expire" | "legal_hold";
  bytes_label: string;
  captured_at: string;
  /** Crop / detection context (P0-T350). */
  class_id?: DetectionClass | null;
  confidence?: number | null;
  /** [x, y, w, h] in source-frame pixels. */
  bbox?: [number, number, number, number] | null;
  finding_id?: string | null;
  asset_id?: string | null;
  /** Object key inside the evidence bucket. */
  object_key?: string;
  /** minio | fs | memory when live; "mock" for the offline store. */
  backend?: string;
  content_type?: string;
  /** Absolute signed URL (live only, short-lived). Absent → procedural art. */
  content_url?: string | null;
  content_expires_at?: string | null;
};

export type OpsMetric = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: "volt" | "steel" | "warn" | "ok";
};
