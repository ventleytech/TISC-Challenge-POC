import {
  DETECTION_CLASSES,
  PARTY_TYPES,
  SEVERITIES,
  WORK_ORDER_COLUMNS,
  type AssetInput,
  type BuildWorkOrderOptions,
  type DetectionClass,
  type FindingInput,
  type PartyHintInput,
  type PartyType,
  type Severity,
  type WorkOrderExport,
  type WorkOrderRow,
  type WorkOrderSource,
} from './types';


const DETECTION_SET = new Set<string>(DETECTION_CLASSES);
const SEVERITY_SET = new Set<string>(SEVERITIES);
const PARTY_SET = new Set<string>(PARTY_TYPES);

const DEFAULT_RECOMMENDATION: Record<DetectionClass, string> = {
  crack: 'Inspect structural integrity; schedule repair if confirmed',
  sag: 'Verify clearance and conductor tension',
  corrosion: 'Assess coating / member condition; remediate per OEM/SLA',
  vegetation: 'Schedule corridor vegetation clearance',
  thermal_hotspot: 'Thermography follow-up; check connection / load',
};

function empty(v: string | null | undefined): string {
  return v == null ? '' : String(v);
}

function assertDetection(classId: string): DetectionClass {
  if (!DETECTION_SET.has(classId)) {
    throw new Error(`Invalid class_id: ${classId}`);
  }
  return classId as DetectionClass;
}

function assertSeverity(severity: string): Severity {
  if (!SEVERITY_SET.has(severity)) {
    throw new Error(`Invalid severity: ${severity}`);
  }
  return severity as Severity;
}

function assertParty(party: string): PartyType {
  if (!PARTY_SET.has(party)) {
    throw new Error(`Invalid party_type: ${party}`);
  }
  return party as PartyType;
}

function formatRisk(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return '';
  return String(score);
}

function resolveRecommendation(finding: FindingInput): string {
  const custom = finding.recommendation;
  if (custom != null && String(custom).length > 0) {
    return String(custom);
  }
  return DEFAULT_RECOMMENDATION[finding.class_id];
}

function resolveAsset(
  finding: FindingInput,
  asset: AssetInput | null | undefined,
): AssetInput {
  if (asset) {
    if (finding.asset_id && asset.id !== finding.asset_id) {
      throw new Error(
        `asset.id ${asset.id} does not match finding.asset_id ${finding.asset_id}`,
      );
    }
    return asset;
  }
  return {
    id: empty(finding.asset_id),
    name: '',
    utility_id: '',
    criticality: '',
    voltage_class: '',
    oem: '',
  };
}

/**
 * Map one finding + asset + party hint → a single work-order row (A07).
 * Pure; no I/O. Throws on invalid enum values or asset id mismatch.
 */
export function buildWorkOrderRow(
  finding: FindingInput,
  asset: AssetInput | null | undefined,
  partyHint: PartyHintInput,
  options: BuildWorkOrderOptions = {},
): WorkOrderRow {
  if (!finding.finding_id) {
    throw new Error('finding_id is required');
  }
  const class_id = assertDetection(finding.class_id);
  const severity = assertSeverity(finding.severity);
  const party_type = assertParty(partyHint.party_type);
  const resolved = resolveAsset({ ...finding, class_id }, asset);
  const prefix = options.idPrefix?.trim() || 'wo';
  const exported_at =
    options.exportedAt != null && String(options.exportedAt).length > 0
      ? String(options.exportedAt)
      : new Date().toISOString();

  return {
    work_order_id: `${prefix}-${finding.finding_id}`,
    finding_id: finding.finding_id,
    inspection_id: empty(finding.inspection_id),
    asset_id: resolved.id,
    asset_name: empty(resolved.name),
    utility_id: empty(resolved.utility_id),
    class_id,
    severity,
    risk_score: formatRisk(finding.risk_score),
    criticality: empty(resolved.criticality),
    voltage_class: empty(resolved.voltage_class),
    party_type,
    warranty_hint: empty(partyHint.warranty_hint),
    tender_ref: empty(partyHint.tender_ref),
    oem: empty(resolved.oem),
    recommendation: resolveRecommendation({ ...finding, class_id }),
    exported_at,
  };
}

/** Batch map sources → rows (stable input order). */
export function buildWorkOrderRows(
  sources: readonly WorkOrderSource[],
  options: BuildWorkOrderOptions = {},
): WorkOrderRow[] {
  return sources.map((s) =>
    buildWorkOrderRow(s.finding, s.asset, s.partyHint, options),
  );
}

/** RFC4180-ish CSV cell escape. */
export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize rows to CSV with WORK_ORDER_COLUMNS header. */
export function toCsv(rows: readonly WorkOrderRow[]): string {
  const header = WORK_ORDER_COLUMNS.join(',');
  const lines = rows.map((row) =>
    WORK_ORDER_COLUMNS.map((col) => csvEscape(String(row[col] ?? ''))).join(
      ',',
    ),
  );
  return [header, ...lines].join('\n');
}

/** Serialize rows to JSON array string (pretty by default). */
export function toJson(
  rows: readonly WorkOrderRow[],
  pretty = true,
): string {
  return pretty ? JSON.stringify(rows, null, 2) : JSON.stringify(rows);
}

/** Build rows and both export encodings in one call. */
export function exportWorkOrders(
  sources: readonly WorkOrderSource[],
  options: BuildWorkOrderOptions = {},
): WorkOrderExport {
  const rows = buildWorkOrderRows(sources, options);
  return {
    rows,
    csv: toCsv(rows),
    json: toJson(rows),
  };
}
