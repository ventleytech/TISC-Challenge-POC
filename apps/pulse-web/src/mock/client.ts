import type {
  Alert,
  Asset,
  AssetKind,
  Criticality,
  DetectionClass,
  EvidenceObject,
  Finding,
  Inspection,
  InspectionCreate,
  InspectionStatus,
  OpsMetric,
  ScheduleKind,
  Severity,
} from "../types/domain";
import {
  DEMO_UTILITY_ID,
  MOCK_ALERTS,
  MOCK_ASSETS,
  MOCK_EVIDENCE,
  MOCK_FINDINGS,
  MOCK_INSPECTIONS,
  MOCK_OPS_METRICS,
} from "./data";
import { criticalityRank, severityRank } from "./risk";

export type AssetFilters = {
  utilityId?: string;
  kind?: AssetKind | "";
  criticality?: Criticality | "";
  q?: string;
};

export type InspectionFilters = {
  utilityId?: string;
  status?: InspectionStatus | "";
  scheduleKind?: ScheduleKind | "";
};

export type FindingFilters = {
  utilityId?: string;
  classId?: Finding["class_id"] | "";
  severity?: Severity | "";
  minRisk?: number;
};

export type AlertFilters = {
  utilityId?: string;
  severity?: Severity | "";
  openOnly?: boolean;
};

type ListResult<T> = { items: T[] };

/** Nest findings row (thinner than C09 board UI). */
type ApiFinding = {
  id: string;
  utility_id: string;
  class_id: DetectionClass;
  severity: Severity;
  risk_score: number;
  inspection_id?: string | null;
  asset_id?: string | null;
};

/** Nest alert row (no title). */
type ApiAlert = {
  id: string;
  utility_id: string;
  finding_id: string;
  inspection_id?: string | null;
  severity: Severity;
  sla_due_at?: string | null;
  ack_at?: string | null;
};

const assetsDb = [...MOCK_ASSETS];
const inspectionsDb = [...MOCK_INSPECTIONS];
const findingsDb = [...MOCK_FINDINGS];
const alertsDb = MOCK_ALERTS.map((a) => ({ ...a }));
/** Live asset names (API rows lack registry mock ids). */
const assetNameCache = new Map<string, string>();
let nextSeq = 100;

function rememberAssets(rows: Asset[]): void {
  for (const a of rows) {
    if (a.id && a.name) assetNameCache.set(a.id, a.name);
  }
}

type VitePulseEnv = {
  VITE_PULSE_API_BASE?: string;
  VITE_PULSE_API_URL?: string;
  VITE_PULSE_API_KEY?: string;
  /** Explicit mock-only mode (T400). Live is default. */
  VITE_PULSE_MOCK?: string;
};

export type AssetCreate = {
  utility_id: string;
  name: string;
  site_id?: string | null;
  criticality?: Criticality;
  voltage_class?: string | null;
  /** UI-only hint; Nest AssetCreate has no kind yet. */
  kind?: AssetKind;
};

/** C09 sort: risk desc → severity → criticality → occurred_at desc → id. */
function compareFindings(a: Finding, b: Finding): number {
  if (b.risk_score !== a.risk_score) return b.risk_score - a.risk_score;
  const sev = severityRank(b.severity) - severityRank(a.severity);
  if (sev !== 0) return sev;
  const crit = criticalityRank(b.criticality) - criticalityRank(a.criticality);
  if (crit !== 0) return crit;
  if (a.occurred_at !== b.occurred_at) {
    return b.occurred_at < a.occurred_at ? -1 : 1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function pulseEnv(): VitePulseEnv | undefined {
  return import.meta.env as VitePulseEnv | undefined;
}

export function liveApiEnabled(): boolean {
  const env = pulseEnv();
  const mock = env?.VITE_PULSE_MOCK?.trim().toLowerCase();
  if (mock === "1" || mock === "true") return false;
  // T400: live-by-default. Opt out with VITE_PULSE_MOCK=1.
  return true;
}

function apiBase(): string {
  const env = pulseEnv();
  return env?.VITE_PULSE_API_URL ?? "http://127.0.0.1:3000/api/v1";
}

function apiHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const key = pulseEnv()?.VITE_PULSE_API_KEY?.trim();
  if (key && !headers.has("X-API-Key")) {
    headers.set("X-API-Key", key);
  }
  return headers;
}

async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${apiBase()}${path}`, {
    ...init,
    headers: apiHeaders(init.headers),
  });
}

async function tryFetchJson<T>(path: string): Promise<T | null> {
  if (!liveApiEnabled()) return null;
  try {
    const res = await apiFetch(path);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function severityToCriticality(severity: Severity): Criticality {
  if (severity === "critical") return "critical";
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

function toUiFinding(row: ApiFinding): Finding {
  return {
    id: row.id,
    utility_id: row.utility_id,
    asset_id: row.asset_id ?? "",
    class_id: row.class_id,
    severity: row.severity,
    criticality: severityToCriticality(row.severity),
    risk_score: row.risk_score,
    recommendation: `Review ${row.class_id.replace(/_/g, " ")} finding`,
    // Nest finding rows omit occurred_at — stamp load time for board meta.
    occurred_at: new Date().toISOString(),
  };
}

function enrichAlert(row: ApiAlert): Alert {
  const seed = alertsDb.find((a) => a.id === row.id);
  return {
    id: row.id,
    utility_id: row.utility_id,
    finding_id: row.finding_id,
    inspection_id: row.inspection_id ?? seed?.inspection_id ?? null,
    severity: row.severity,
    title:
      seed?.title ??
      `Alert · ${row.severity} · ${row.finding_id.slice(0, 8)}`,
    sla_due_at: row.sla_due_at ?? seed?.sla_due_at ?? null,
    ack_at: row.ack_at ?? seed?.ack_at ?? null,
  };
}

export async function listAssets(
  filters: AssetFilters = {},
): Promise<ListResult<Asset>> {
  const utilityId = filters.utilityId ?? DEMO_UTILITY_ID;
  const live = await tryFetchJson<ListResult<Asset>>(
    `/assets?utility_id=${encodeURIComponent(utilityId)}`,
  );
  let items = (live?.items ?? assetsDb.filter((a) => a.utility_id === utilityId)).map(
    (a) => ({ ...a, kind: a.kind ?? ("tower" as AssetKind) }),
  );
  rememberAssets(items);

  if (filters.kind) {
    items = items.filter((a) => a.kind === filters.kind);
  }
  if (filters.criticality) {
    items = items.filter((a) => a.criticality === filters.criticality);
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    items = items.filter((a) => a.name.toLowerCase().includes(q));
  }
  return { items };
}

export async function getAsset(assetId: string): Promise<Asset | null> {
  const live = await tryFetchJson<Asset>(`/assets/${encodeURIComponent(assetId)}`);
  if (live) {
    const partial = live as Partial<Asset> & Asset;
    return { ...partial, kind: partial.kind ?? "tower" };
  }
  return assetsDb.find((a) => a.id === assetId) ?? null;
}

export async function listInspections(
  filters: InspectionFilters = {},
): Promise<ListResult<Inspection>> {
  const utilityId = filters.utilityId ?? DEMO_UTILITY_ID;
  const statusQ = filters.status
    ? `&status=${encodeURIComponent(filters.status)}`
    : "";
  const live = await tryFetchJson<ListResult<Inspection>>(
    `/inspections?utility_id=${encodeURIComponent(utilityId)}${statusQ}`,
  );
  let items =
    live?.items ??
    inspectionsDb.filter((i) => i.utility_id === utilityId);

  // Live Nest rows are thin — fill board fields from linked findings.
  if (live?.items) {
    const findingsLive = await tryFetchJson<ListResult<ApiFinding>>(
      `/findings?utility_id=${encodeURIComponent(utilityId)}`,
    );
    const counts = new Map<string, number>();
    for (const f of findingsLive?.items ?? []) {
      if (!f.inspection_id) continue;
      counts.set(f.inspection_id, (counts.get(f.inspection_id) ?? 0) + 1);
    }
    items = items.map((row) => {
      const findingCount = counts.get(row.id) ?? row.finding_count ?? 0;
      const advanced =
        findingCount > 0 && row.status === "planned" ? "review" : row.status;
      return {
        ...row,
        status: advanced,
        schedule_kind: row.schedule_kind ?? "line",
        assignee: row.assignee ?? "Gate0 · corrosion YOLO",
        finding_count: findingCount,
        sla_hours_left: row.sla_hours_left ?? 18,
      };
    });
  }

  if (filters.status) {
    items = items.filter((i) => i.status === filters.status);
  }
  if (filters.scheduleKind) {
    items = items.filter((i) => i.schedule_kind === filters.scheduleKind);
  }
  return { items };
}

export async function createInspection(
  body: InspectionCreate,
): Promise<{ id: string }> {
  if (liveApiEnabled()) {
    const res = await apiFetch(`/inspections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(detail || `create inspection failed (${res.status})`);
    }
    return (await res.json()) as { id: string };
  }
  const id = `insp-mock-${nextSeq++}`;
  inspectionsDb.unshift({
    id,
    utility_id: body.utility_id,
    status: "planned",
    asset_ids: body.asset_ids ?? [],
    schedule_kind: body.schedule_kind ?? null,
    planned_at: body.planned_at ?? null,
    assignee: "Scheduler",
    finding_count: 0,
    sla_hours_left: 72,
  });
  return { id };
}

export async function createAsset(body: AssetCreate): Promise<{ id: string }> {
  if (liveApiEnabled()) {
    const res = await apiFetch(`/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utility_id: body.utility_id,
        name: body.name,
        site_id: body.site_id ?? null,
        criticality: body.criticality,
        voltage_class: body.voltage_class ?? null,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(detail || `create asset failed (${res.status})`);
    }
    return (await res.json()) as { id: string };
  }
  const id = `ast-mock-${nextSeq++}`;
  assetsDb.unshift({
    id,
    utility_id: body.utility_id,
    name: body.name,
    kind: body.kind ?? "tower",
    criticality: body.criticality,
    voltage_class: body.voltage_class ?? null,
    parent_id: null,
    oem: null,
    install_year: null,
    circuit: null,
  });
  return { id };
}

/** Sync mock helper kept for offline fixtures. Prefer listAssetsForScheduleKind. */
export function assetsForScheduleKind(kind: ScheduleKind): Asset[] {
  return assetsDb.filter(
    (a) => a.utility_id === DEMO_UTILITY_ID && a.kind === kind,
  );
}

/** Live-aware schedule candidates (T401). */
export async function listAssetsForScheduleKind(
  kind: ScheduleKind,
): Promise<Asset[]> {
  const { items } = await listAssets({ utilityId: DEMO_UTILITY_ID });
  const matched = items.filter((a) => a.kind === kind);
  return matched.length > 0 ? matched : items;
}

export async function listFindings(
  filters: FindingFilters = {},
): Promise<ListResult<Finding>> {
  const utilityId = filters.utilityId ?? DEMO_UTILITY_ID;
  const live = await tryFetchJson<ListResult<ApiFinding>>(
    `/findings?utility_id=${encodeURIComponent(utilityId)}`,
  );
  // Warm name cache so Priority board links show tower names, not UUIDs.
  if (live?.items?.length) {
    const assetsLive = await tryFetchJson<ListResult<Asset>>(
      `/assets?utility_id=${encodeURIComponent(utilityId)}`,
    );
    if (assetsLive?.items) rememberAssets(assetsLive.items);
  }

  let items: Finding[] = live?.items
    ? live.items.map(toUiFinding)
    : findingsDb.filter((f) => f.utility_id === utilityId);

  if (filters.classId) {
    items = items.filter((f) => f.class_id === filters.classId);
  }
  if (filters.severity) {
    items = items.filter((f) => f.severity === filters.severity);
  }
  if (typeof filters.minRisk === "number" && !Number.isNaN(filters.minRisk)) {
    items = items.filter((f) => f.risk_score >= filters.minRisk!);
  }

  return { items: items.slice().sort(compareFindings) };
}

export async function listAlerts(
  filters: AlertFilters = {},
): Promise<ListResult<Alert>> {
  const utilityId = filters.utilityId ?? DEMO_UTILITY_ID;
  const severityQ = filters.severity
    ? `&severity=${encodeURIComponent(filters.severity)}`
    : "";
  const live = await tryFetchJson<ListResult<ApiAlert>>(
    `/alerts?utility_id=${encodeURIComponent(utilityId)}${severityQ}`,
  );

  let items =
    live?.items?.map(enrichAlert) ??
    alertsDb.filter((a) => a.utility_id === utilityId);

  if (filters.severity) {
    items = items.filter((a) => a.severity === filters.severity);
  }
  if (filters.openOnly) {
    items = items.filter((a) => !a.ack_at);
  }

  items = items.slice().sort((a, b) => {
    const aDue = a.sla_due_at ?? "";
    const bDue = b.sla_due_at ?? "";
    if (aDue !== bDue) return aDue < bDue ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  return { items };
}

/**
 * Acknowledge alert. Live: POST /alerts/:id/ack when enabled.
 * Unset / failure → mock-local row if present.
 */
export async function ackAlert(alertId: string): Promise<Alert | null> {
  if (liveApiEnabled()) {
    try {
      const res = await apiFetch(`/alerts/${encodeURIComponent(alertId)}/ack`, {
        method: "POST",
      });
      if (res.ok) {
        const row = enrichAlert((await res.json()) as ApiAlert);
        const local = alertsDb.find((a) => a.id === alertId);
        if (local) {
          local.ack_at = row.ack_at;
        }
        return row;
      }
    } catch {
      // fall through to mock
    }
  }

  const row = alertsDb.find((a) => a.id === alertId);
  if (!row) return null;
  if (!row.ack_at) {
    row.ack_at = new Date().toISOString();
  }
  return { ...row };
}

export type EvidenceFilters = {
  inspectionId?: string | "";
  kind?: EvidenceObject["kind"] | "";
  retention?: EvidenceObject["retention"] | "";
};

/** Nest evidence row (P0-T350). `content_path` is relative to the API base. */
type ApiEvidence = {
  id: string;
  inspection_id: string;
  kind: EvidenceObject["kind"];
  retention: EvidenceObject["retention"];
  captured_at: string;
  bytes: number;
  content_type: string;
  class_id?: DetectionClass | null;
  confidence?: number | null;
  bbox?: [number, number, number, number] | null;
  finding_id?: string | null;
  asset_id?: string | null;
  label?: string | null;
  object_key: string;
  backend: string;
  content_path: string;
  content_expires_at: string;
};

function bytesLabel(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

function toUiEvidence(row: ApiEvidence): EvidenceObject {
  return {
    id: row.id,
    inspection_id: row.inspection_id,
    label:
      row.label ??
      `${(row.class_id ?? row.kind).replace(/_/g, " ")} · ${row.kind.replace(/_/g, " ")}`,
    kind: row.kind,
    retention: row.retention,
    bytes_label: bytesLabel(row.bytes),
    captured_at: row.captured_at,
    class_id: row.class_id,
    confidence: row.confidence,
    bbox: row.bbox,
    finding_id: row.finding_id,
    asset_id: row.asset_id,
    object_key: row.object_key,
    backend: row.backend,
    content_type: row.content_type,
    content_url: `${apiBase()}${row.content_path}`,
    content_expires_at: row.content_expires_at,
  };
}

/**
 * Live Nest when configured and reachable (even if the bucket is empty);
 * otherwise the offline mock store. `source` tells the page which it got.
 */
export async function listEvidence(
  filters: EvidenceFilters = {},
): Promise<ListResult<EvidenceObject> & { source: "live" | "mock" }> {
  const utilityId = DEMO_UTILITY_ID;
  const q = new URLSearchParams({ utility_id: utilityId });
  if (filters.inspectionId) q.set("inspection_id", filters.inspectionId);
  if (filters.kind) q.set("kind", filters.kind);
  const live = await tryFetchJson<ListResult<ApiEvidence>>(`/evidence?${q}`);

  let items: EvidenceObject[];
  let source: "live" | "mock";
  if (live) {
    items = live.items.map(toUiEvidence);
    source = "live";
  } else {
    items = [...MOCK_EVIDENCE];
    source = "mock";
    if (filters.inspectionId) {
      items = items.filter((e) => e.inspection_id === filters.inspectionId);
    }
    if (filters.kind) {
      items = items.filter((e) => e.kind === filters.kind);
    }
  }
  if (filters.retention) {
    items = items.filter((e) => e.retention === filters.retention);
  }
  return { items, source };
}

export async function listOpsMetrics(): Promise<ListResult<OpsMetric>> {
  return { items: [...MOCK_OPS_METRICS] };
}

export function assetName(assetId: string): string {
  return (
    assetNameCache.get(assetId) ??
    assetsDb.find((a) => a.id === assetId)?.name ??
    assetId
  );
}

export type CsvImportResult = {
  dry_run: boolean;
  row_count: number;
  errors: string[];
  site_ids: string[];
  asset_ids: string[];
};

/** M03 CSV import (T406). Default dry_run=true. */
export async function importAssetsCsv(
  utilityId: string,
  csv: string,
  dryRun = true,
): Promise<CsvImportResult> {
  if (!liveApiEnabled()) {
    // mock dry-run counts non-empty lines minus header
    const lines = csv.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
    return {
      dry_run: dryRun,
      row_count: Math.max(0, lines.length - 1),
      errors: [],
      site_ids: [],
      asset_ids: dryRun ? [] : [`ast-mock-${nextSeq++}`],
    };
  }
  const res = await apiFetch(
    `/utilities/${encodeURIComponent(utilityId)}/import-csv`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, dry_run: dryRun }),
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `CSV import failed (${res.status})`);
  }
  return (await res.json()) as CsvImportResult;
}

/** W06 compliance HTML (printable → PDF). */
export function complianceReportUrl(
  utilityId: string,
  inspectionId?: string,
): string {
  const q = new URLSearchParams({ utility_id: utilityId });
  if (inspectionId) q.set("inspection_id", inspectionId);
  return `${apiBase()}/reports/compliance?${q.toString()}`;
}
