# P0-T080 — Responsibility / warranty hints (S9 · A04–A06)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master catalog A04–A06 / S9) |
| Parallel | `ok` vs apps/* (pure package) |
| Branch | `vp/P0-T080-responsibility` |
| Deps | `P0-T002` contracts enums (detection ids) — soft; package embeds aligned consts |

## Objective

Ship a pure `@voltpulse/responsibility` package: given finding `class_id` + asset OEM/warranty/SLA/tender fields → `party_type` hint, `warranty_hint`, and optional `tender_ref` for scenario **S9** (A04–A06). No Nest/UI wiring.

## Input docs

- `docs/product/requirements.md` (detection enum; vendor/responsibility hints)
- `docs/product/feature-catalog.md` (A04–A06)
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `packages/contracts/enums/detection.json`
- Plan / catalog: `task-plans/2026-11-18-gate0-and-p0-spine.md`; local master plan A*/S9 rows (gitignored)

## Allowed paths

- `packages/responsibility/**`
- `task-cards/P0-T080/**`
- `docs/repo-structure.md` (one-line package list only, optional)
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only, optional)

Do **not** edit: `apps/pulse-api`, `apps/pulse-web`, `apps/pulse-store`, `apps/grid-perception`, `apps/pulse-train`, or other workers’ apps.

## Acceptance criteria

- [x] Package `@voltpulse/responsibility` under `packages/responsibility/` with README
- [x] Pure function(s): inputs = detection `class_id` + asset OEM/install/warranty/SLA/tender (+ optional `asOf`) → `{ party_type, warranty_hint, tender_ref? }`
- [x] `party_type` covers A04 (oem / installer / contractors / utility / unknown)
- [x] `warranty_hint` covers A06 (`no_warranty_data` | `in_warranty` | `warranty_expired` | `warranty_breach_suspect` | `sla_active`)
- [x] Optional `tender_ref` passthrough for A05 when asset provides it
- [x] Unit tests for corrosion-in-warranty, vegetation→contractor, expired warranty, missing dates, tender_ref
- [x] Detection ids align with VoltPulse: `crack | sag | corrosion | vegetation | thermal_hotspot`
- [x] No internal product brand strings / proprietary paste
- [x] Evidence under `./evidence/` with test output + anti-leak grep

## Validation

```bash
cd packages/responsibility && npm install && npm test && npm run build
rg -ni 'trinetra|t-netra|tnetra' packages/responsibility && exit 1 || true
test -f packages/responsibility/README.md
graphify update .
```

## Evidence

`./evidence/01-unit-tests.md`

## Anti-leak

- [x] VoltPulse names only
- [x] No proprietary responsibility matrices / customer OEM lists
- [x] Synthetic field names only

## Notes

- Consumed later by `grid-rules` / `pulse-api` findings enrichment — out of scope here.
- Prefer self-contained package over mutating `packages/contracts` (other workers).
