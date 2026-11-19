import type {
  AssetResponsibilityInput,
  DetectionClass,
  PartyType,
  ResponsibilityHint,
  ResponsibilityHintInput,
  WarrantyHint,
} from './types.js';

/** Defect classes commonly covered by OEM structural / coating warranties. */
const OEM_COVERED: ReadonlySet<DetectionClass> = new Set([
  'crack',
  'corrosion',
  'thermal_hotspot',
]);

function parseDay(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${iso}`);
  }
  return d;
}

function onOrBefore(asOf: Date, end: Date): boolean {
  return asOf.getTime() <= end.getTime();
}

/**
 * Base warranty window from warranty_end (ignores SLA).
 * Returns null when no usable warranty_end.
 */
export function isWithinWarranty(
  asset: Pick<AssetResponsibilityInput, 'warranty_end'>,
  asOf: Date,
): boolean | null {
  const end = parseDay(asset.warranty_end);
  if (!end) return null;
  return onOrBefore(asOf, end);
}

export function isWithinAntiCorrosionSla(
  asset: Pick<AssetResponsibilityInput, 'anti_corrosion_sla_end'>,
  asOf: Date,
): boolean | null {
  const end = parseDay(asset.anti_corrosion_sla_end);
  if (!end) return null;
  return onOrBefore(asOf, end);
}

function resolveWarrantyHint(
  classId: DetectionClass,
  asset: AssetResponsibilityInput,
  asOf: Date,
): WarrantyHint {
  const inWarranty = isWithinWarranty(asset, asOf);
  const inSla =
    classId === 'corrosion'
      ? isWithinAntiCorrosionSla(asset, asOf)
      : null;

  if (inWarranty === true && OEM_COVERED.has(classId)) {
    return 'warranty_breach_suspect';
  }
  if (inSla === true && classId === 'corrosion') {
    return 'sla_active';
  }
  if (inWarranty === true) {
    return 'in_warranty';
  }
  if (inWarranty === false) {
    return 'warranty_expired';
  }
  // No warranty_end — corrosion may still have SLA-only coverage
  if (inSla === true) {
    return 'sla_active';
  }
  return 'no_warranty_data';
}

function resolvePartyType(
  classId: DetectionClass,
  warrantyHint: WarrantyHint,
): PartyType {
  if (classId === 'vegetation') {
    return 'vegetation_contractor';
  }

  const oemLikely =
    warrantyHint === 'warranty_breach_suspect' ||
    warrantyHint === 'in_warranty' ||
    warrantyHint === 'sla_active';

  switch (classId) {
    case 'corrosion':
      return oemLikely ? 'oem' : 'maintenance_contractor';
    case 'crack':
    case 'thermal_hotspot':
      return oemLikely ? 'oem' : 'utility';
    case 'sag':
      return oemLikely ? 'installer' : 'utility';
    default: {
      const _exhaustive: never = classId;
      return _exhaustive;
    }
  }
}

/**
 * A04–A06: map finding class + asset OEM/warranty/SLA/tender → responsibility hints.
 * Pure; no I/O. Throws on invalid `asOf` / date strings.
 */
export function hintResponsibility(
  input: ResponsibilityHintInput,
): ResponsibilityHint {
  const asOf = parseDay(input.asOf) ?? new Date();
  const warranty_hint = resolveWarrantyHint(input.class_id, input.asset, asOf);
  const party_type = resolvePartyType(input.class_id, warranty_hint);
  const tender =
    input.asset.tender_ref != null && String(input.asset.tender_ref).length > 0
      ? String(input.asset.tender_ref)
      : null;

  const out: ResponsibilityHint = {
    party_type,
    warranty_hint,
    tender_ref: tender,
  };
  return out;
}
