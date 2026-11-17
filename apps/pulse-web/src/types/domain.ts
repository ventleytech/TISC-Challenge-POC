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
