/** Aligns with packages/contracts enums/detection.json */

export const DETECTION_CLASSES = [
  'crack',
  'sag',
  'corrosion',
  'vegetation',
  'thermal_hotspot',
] as const;
export type DetectionClass = (typeof DETECTION_CLASSES)[number];

/** A04 responsible-party hint */
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

/** A06 warranty / SLA status hint */
export const WARRANTY_HINTS = [
  'no_warranty_data',
  'in_warranty',
  'warranty_expired',
  'warranty_breach_suspect',
  'sla_active',
] as const;
export type WarrantyHint = (typeof WARRANTY_HINTS)[number];

/** Asset OEM / warranty / tender fields used for hints (A02 + A05). */
export type AssetResponsibilityInput = {
  oem?: string | null;
  install_date?: string | null;
  warranty_end?: string | null;
  anti_corrosion_sla_end?: string | null;
  /** A05 tender/contract reference when known on the asset */
  tender_ref?: string | null;
};

export type ResponsibilityHintInput = {
  class_id: DetectionClass;
  asset: AssetResponsibilityInput;
  /** Observation instant (ISO date or date-time). Defaults to now. */
  asOf?: string | null;
};

export type ResponsibilityHint = {
  party_type: PartyType;
  warranty_hint: WarrantyHint;
  /** Echo of asset.tender_ref when present (A05) */
  tender_ref?: string | null;
};
