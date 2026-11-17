import type {
  Asset,
  AssetKind,
  Criticality,
  Inspection,
  InspectionCreate,
  InspectionStatus,
  ScheduleKind,
} from "../types/domain";
import { DEMO_UTILITY_ID, MOCK_ASSETS, MOCK_INSPECTIONS } from "./data";

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

type ListResult<T> = { items: T[] };

const assetsDb = [...MOCK_ASSETS];
const inspectionsDb = [...MOCK_INSPECTIONS];
let nextSeq = 100;

function liveApiEnabled(): boolean {
  return (
    import.meta.env.VITE_PULSE_API_BASE === "1" ||
    Boolean(import.meta.env.VITE_PULSE_API_URL)
  );
}

function apiBase(): string {
  return (
    (import.meta.env.VITE_PULSE_API_URL as string | undefined) ??
    "http://127.0.0.1:3000/api/v1"
  );
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
    // Live API stub may omit kind — UI default until Nest extends A01.
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
  });
  return { id };
}

export function assetsForScheduleKind(kind: ScheduleKind): Asset[] {
  return assetsDb.filter(
    (a) => a.utility_id === DEMO_UTILITY_ID && a.kind === kind,
  );
}
