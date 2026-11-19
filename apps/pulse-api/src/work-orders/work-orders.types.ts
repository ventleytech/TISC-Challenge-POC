/** Request DTOs for A07 work-order export (pulse-api stub). */

export type WorkOrderExportFormat = 'json' | 'csv';

export type FindingBody = {
  finding_id: string;
  inspection_id?: string | null;
  class_id: string;
  severity: string;
  risk_score?: number | null;
  asset_id?: string | null;
  recommendation?: string | null;
};

export type PartyHintBody = {
  party_type: string;
  warranty_hint?: string | null;
  tender_ref?: string | null;
};

/** Optional inline asset fields (merged over DomainStore hydration). */
export type AssetOverrideBody = {
  id?: string;
  name?: string;
  utility_id?: string | null;
  criticality?: string | null;
  voltage_class?: string | null;
  oem?: string | null;
};

export type WorkOrderExportItemBody = {
  finding: FindingBody;
  /** Prefer store lookup; falls back to finding.asset_id. */
  asset_id?: string | null;
  asset?: AssetOverrideBody | null;
  party_hint: PartyHintBody;
};

export type WorkOrderExportBody = {
  utility_id: string;
  items: WorkOrderExportItemBody[];
  exported_at?: string | null;
  id_prefix?: string | null;
};
