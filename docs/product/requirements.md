# Requirements (slim index)

**Full FRD:** [`frd.md`](frd.md) — binding functional matrix.

## Goal

Operators schedule/run drone or media inspections; five defect classes; rank by severity × asset criticality; push/SMS + SLA; vendor/responsibility hints; governed evidence; multi-utility RBAC; three-pillar observability; **automatic** retrain triggers.

Phases: **P0** Demo Day spine · **P1** build window · **P2** pilot/scale.

## Roles

| Role | Scope |
|------|--------|
| `platform_admin` | Utilities/orgs; ceilings; Sense profiles |
| `utility_admin` | Org onboarding |
| `energy_supervisor` | Schedule, policy, SLA, vendors; canary veto |
| `energy_operator` | Sessions, findings, ack, labels |
| `viewer` | Read-only |

Rows scoped by `utility_id` (+ optional `dept_code`).

## Detection IDs

`crack` · `sag` · `corrosion` · `vegetation` · `thermal_hotspot`

## Severity

`critical` · `high` · `medium` · `low` · `info`  
Risk: `f(severity, confidence, asset.criticality, voltage_class)`.

## Must-have spine (P0)

Live **or** MP4 upload ingest · shared inference contract · detectors + evidence · ranked findings · vendor hint · push/SMS + SLA + ack · history · auth/roles · object store evidence IDs · pipeline health strip

## How / ops

| Doc | Content |
|-----|---------|
| [`../tdd.md`](../tdd.md) | Technical design + diagrams |
| [`../architecture.md`](../architecture.md) | Planes / ownership |
| [`../observability.md`](../observability.md) | Obs pillars |
| [`../retraining.md`](../retraining.md) | Auto CT |
