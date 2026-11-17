# Requirements (slim)

## Goal

Operators schedule/run drone or media inspections; five defect classes; rank by severity × asset criticality; push/SMS + SLA; vendor/responsibility hints; governed evidence; multi-utility RBAC; observability; retrain feedback.

Phases: **P0** Demo Day spine · **P1** Nov 21–30 · **P2** post-demo/pilot.

## Roles

| Role | Scope |
|------|--------|
| `platform_admin` | Utilities/orgs; ceilings |
| `utility_admin` | Org onboarding |
| `energy_supervisor` | Schedule, policy, SLA, vendors |
| `energy_operator` | Sessions, findings, ack, labels |
| `viewer` | Read-only |

Rows scoped by `utility_id` (+ optional `dept_code`).

## Detection IDs

`crack` · `sag` · `corrosion` · `vegetation` · `thermal_hotspot`

## Severity

`critical` · `high` · `medium` · `low` · `info`  
Risk: `f(severity, confidence, asset.criticality, voltage_class)`.

## Must-have spine (P0)

Live or upload ingest · shared inference contract · detectors + evidence · ranked findings · push/SMS + SLA + ack · history · auth/roles · object store evidence IDs

Full matrix + WOW narrative: `local-notes/02-requirements-ui/02-requirements.md`, `local-notes/02-requirements-ui/11-feature-catalog.md` — promote only when needed.
