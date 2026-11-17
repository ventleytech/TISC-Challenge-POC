import type { Asset, Inspection } from "../types/domain";

/** Demo utility — not a real customer corridor. */
export const DEMO_UTILITY_ID = "util-demo-01";

export const MOCK_ASSETS: Asset[] = [
  {
    id: "ast-line-01",
    utility_id: DEMO_UTILITY_ID,
    name: "North Ridge 132 kV",
    kind: "line",
    criticality: "high",
    voltage_class: "132kV",
    parent_id: null,
  },
  {
    id: "ast-feeder-01",
    utility_id: DEMO_UTILITY_ID,
    name: "Feeder F-14",
    kind: "feeder",
    criticality: "critical",
    voltage_class: "33kV",
    parent_id: "ast-line-01",
  },
  {
    id: "ast-feeder-02",
    utility_id: DEMO_UTILITY_ID,
    name: "Feeder F-22",
    kind: "feeder",
    criticality: "medium",
    voltage_class: "33kV",
    parent_id: "ast-line-01",
  },
  {
    id: "ast-sub-01",
    utility_id: DEMO_UTILITY_ID,
    name: "West Gate Substation",
    kind: "substation",
    criticality: "critical",
    voltage_class: "132/33kV",
    parent_id: null,
  },
  {
    id: "ast-tower-01",
    utility_id: DEMO_UTILITY_ID,
    name: "Tower T-108",
    kind: "tower",
    criticality: "high",
    voltage_class: "132kV",
    parent_id: "ast-line-01",
  },
  {
    id: "ast-span-01",
    utility_id: DEMO_UTILITY_ID,
    name: "Span T-108–T-109",
    kind: "span",
    criticality: "medium",
    voltage_class: "132kV",
    parent_id: "ast-tower-01",
  },
];

export const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: "insp-01",
    utility_id: DEMO_UTILITY_ID,
    status: "planned",
    asset_ids: ["ast-feeder-01"],
    schedule_kind: "feeder",
    planned_at: "2026-11-20T08:00:00Z",
  },
  {
    id: "insp-02",
    utility_id: DEMO_UTILITY_ID,
    status: "in_progress",
    asset_ids: ["ast-line-01"],
    schedule_kind: "line",
    planned_at: "2026-11-18T06:30:00Z",
  },
  {
    id: "insp-03",
    utility_id: DEMO_UTILITY_ID,
    status: "review",
    asset_ids: ["ast-sub-01"],
    schedule_kind: "substation",
    planned_at: "2026-11-15T10:00:00Z",
  },
];
