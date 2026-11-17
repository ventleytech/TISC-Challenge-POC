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

export type Utility = {
  id: string;
  name: string;
  created_at: string;
};

export type UtilityCreate = {
  name: string;
  /** Optional stub API key for first utility_admin; generated if omitted. */
  admin_api_key?: string;
};

export type Site = {
  id: string;
  utility_id: string;
  name: string;
};

export type SiteSeed = {
  name: string;
};

export type UtilityMembership = {
  id: string;
  utility_id: string;
  role: 'utility_admin';
  key_id: string;
};

export type Asset = {
  id: string;
  utility_id: string;
  name: string;
  site_id?: string | null;
  criticality?: Criticality;
  voltage_class?: string | null;
};

export type AssetCreate = {
  utility_id: string;
  name: string;
  site_id?: string | null;
  criticality?: Criticality;
  voltage_class?: string | null;
};

export type AssetSeed = {
  name: string;
  site_id?: string | null;
  criticality?: Criticality;
  voltage_class?: string | null;
};

export type UtilitySeed = {
  sites?: SiteSeed[];
  assets?: AssetSeed[];
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
