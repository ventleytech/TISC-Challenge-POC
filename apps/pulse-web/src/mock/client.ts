import type {
  Alert,
  Asset,
  AssetKind,
  Criticality,
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

const assetsDb = [...MOCK_ASSETS];
const inspectionsDb = [...MOCK_INSPECTIONS];
const findingsDb = [...MOCK_FINDINGS];
const alertsDb = MOCK_ALERTS.map((a) => ({ ...a }));
let nextSeq = 100;

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

function liveApiEnabled(): boolean {
  const env = import.meta.env as
    | { VITE_PULSE_API_BASE?: string; VITE_PULSE_API_URL?: string }
    | undefined;
  return env?.VITE_PULSE_API_BASE === "1" || Boolean(env?.VITE_PULSE_API_URL);
}

function apiBase(): string {
  const env = import.meta.env as { VITE_PULSE_API_URL?: string } | undefined;
  return env?.VITE_PULSE_API_URL ?? "http://127.0.0.1:3000/api/v1";
}

async function tryFetchJson<T>(path: string): Promise<T | null> {
  if (!liveApiEnabled()) return null;
  try {
    const res = await fetch(`${apiBase()}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function listAssets(
  filters: AssetFilters = {},
): Promise<ListResult<Asset>> {
  const utilityId = filters.utilityId ?? DEMO_UTILITY_ID;
  const live = await tryFetchJson<ListResult<Asset>>(
    `/assets?utility_id=${encodeURIComponent(utilityId)}`,
  );
  let items = live?.items ?? assetsDb.filter((a) => a.utility_id === utilityId);

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
    try {
      const res = await fetch(`${apiBase()}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) return (await res.json()) as { id: string };
    } catch {
      // fall through to mock
    }
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

export function assetsForScheduleKind(kind: ScheduleKind): Asset[] {
  return assetsDb.filter(
    (a) => a.utility_id === DEMO_UTILITY_ID && a.kind === kind,
  );
}

export async function listFindings(
  filters: FindingFilters = {},
): Promise<ListResult<Finding>> {
  const utilityId = filters.utilityId ?? DEMO_UTILITY_ID;
  let items = findingsDb.filter((f) => f.utility_id === utilityId);

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
  const live = await tryFetchJson<ListResult<Alert>>(
    `/alerts?utility_id=${encodeURIComponent(utilityId)}${severityQ}`,
  );

  let items =
    live?.items?.map((row) => {
      const seed = alertsDb.find((a) => a.id === row.id);
      return {
        ...row,
        title: seed?.title ?? `Alert ${row.id}`,
        ack_at: row.ack_at ?? seed?.ack_at ?? null,
        sla_due_at: row.sla_due_at ?? seed?.sla_due_at ?? null,
      };
    }) ?? alertsDb.filter((a) => a.utility_id === utilityId);

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

/** Mock acknowledge — local state only. */
export async function ackAlert(alertId: string): Promise<Alert | null> {
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

export async function listEvidence(
  filters: EvidenceFilters = {},
): Promise<ListResult<EvidenceObject>> {
  let items = [...MOCK_EVIDENCE];
  if (filters.inspectionId) {
    items = items.filter((e) => e.inspection_id === filters.inspectionId);
  }
  if (filters.kind) {
    items = items.filter((e) => e.kind === filters.kind);
  }
  if (filters.retention) {
    items = items.filter((e) => e.retention === filters.retention);
  }
  return { items };
}

export async function listOpsMetrics(): Promise<ListResult<OpsMetric>> {
  return { items: [...MOCK_OPS_METRICS] };
}

export function assetName(assetId: string): string {
  return assetsDb.find((a) => a.id === assetId)?.name ?? assetId;
}
