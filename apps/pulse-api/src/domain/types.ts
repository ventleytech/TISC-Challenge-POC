export const INSPECTION_STATUSES = [
  'planned',
  'in_progress',
  'processing',
  'review',
  'closed',
  'cancelled',
] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

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

export type Inspection = {
  id: string;
  utility_id: string;
  status: InspectionStatus;
  asset_ids?: string[];
  planned_at?: string | null;
};

export type InspectionCreate = {
  utility_id: string;
  asset_ids?: string[];
  planned_at?: string | null;
};

export type Asset = {
  id: string;
  utility_id: string;
  name: string;
  criticality?: Criticality;
  voltage_class?: string | null;
};

export type AssetCreate = {
  utility_id: string;
  name: string;
  criticality?: Criticality;
  voltage_class?: string | null;
};

export type Alert = {
  id: string;
  finding_id: string;
  utility_id: string;
  severity: Severity;
  inspection_id?: string;
  sla_due_at?: string | null;
  ack_at?: string | null;
};

export type AlertCreate = {
  finding_id: string;
  utility_id: string;
  severity: Severity;
  inspection_id?: string;
  sla_due_at?: string | null;
};
