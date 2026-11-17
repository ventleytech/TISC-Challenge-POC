import type { Alert, Asset, Finding, Inspection } from "../types/domain";
import { riskScore } from "./risk";

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

function finding(
  partial: Omit<Finding, "risk_score" | "utility_id"> & {
    utility_id?: string;
  },
): Finding {
  return {
    utility_id: DEMO_UTILITY_ID,
    ...partial,
    risk_score: riskScore(partial.severity, partial.criticality),
  };
}

/** Seed findings — unsorted; client sorts by risk desc (C09 / W01). */
export const MOCK_FINDINGS: Finding[] = [
  finding({
    id: "fnd-01",
    asset_id: "ast-feeder-01",
    class_id: "corrosion",
    severity: "high",
    criticality: "critical",
    recommendation: "Inspect insulator hardware; schedule follow-up climb.",
    occurred_at: "2026-11-18T07:12:00Z",
  }),
  finding({
    id: "fnd-02",
    asset_id: "ast-tower-01",
    class_id: "crack",
    severity: "critical",
    criticality: "high",
    recommendation: "Isolate span; engineer review before next energisation.",
    occurred_at: "2026-11-18T06:48:00Z",
  }),
  finding({
    id: "fnd-03",
    asset_id: "ast-line-01",
    class_id: "vegetation",
    severity: "medium",
    criticality: "high",
    recommendation: "Trim corridor within 14 days; vendor hint pending.",
    occurred_at: "2026-11-17T16:20:00Z",
  }),
  finding({
    id: "fnd-04",
    asset_id: "ast-sub-01",
    class_id: "thermal_hotspot",
    severity: "high",
    criticality: "critical",
    recommendation: "IR recheck bus coupler; open work order.",
    occurred_at: "2026-11-18T05:05:00Z",
  }),
  finding({
    id: "fnd-05",
    asset_id: "ast-span-01",
    class_id: "sag",
    severity: "low",
    criticality: "medium",
    recommendation: "Monitor clearance; no immediate outage.",
    occurred_at: "2026-11-16T11:00:00Z",
  }),
  finding({
    id: "fnd-06",
    asset_id: "ast-feeder-02",
    class_id: "corrosion",
    severity: "info",
    criticality: "low",
    recommendation: "Log for next cycle; no SLA alert.",
    occurred_at: "2026-11-15T09:30:00Z",
  }),
];

/** Relative SLA windows from “now” so countdown demo stays live. */
function dueIn(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export const MOCK_ALERTS: Alert[] = [
  {
    id: "alt-01",
    utility_id: DEMO_UTILITY_ID,
    finding_id: "fnd-02",
    inspection_id: "insp-02",
    severity: "critical",
    title: "Crack on Tower T-108",
    sla_due_at: dueIn(18),
    ack_at: null,
  },
  {
    id: "alt-02",
    utility_id: DEMO_UTILITY_ID,
    finding_id: "fnd-04",
    inspection_id: "insp-03",
    severity: "high",
    title: "Thermal hotspot — West Gate",
    sla_due_at: dueIn(45),
    ack_at: null,
  },
  {
    id: "alt-03",
    utility_id: DEMO_UTILITY_ID,
    finding_id: "fnd-01",
    inspection_id: "insp-01",
    severity: "high",
    title: "Corrosion — Feeder F-14",
    sla_due_at: dueIn(-12),
    ack_at: null,
  },
  {
    id: "alt-04",
    utility_id: DEMO_UTILITY_ID,
    finding_id: "fnd-03",
    inspection_id: "insp-02",
    severity: "medium",
    title: "Vegetation encroachment — North Ridge",
    sla_due_at: dueIn(120),
    ack_at: "2026-11-18T08:00:00Z",
  },
];
