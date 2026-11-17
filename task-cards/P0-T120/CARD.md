# P0-T120 — W06 compliance report PDF stub

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master W06) |
| Parallel | `ok` vs apps/* / audit / responsibility packages |
| Branch | `vp/P0-T120-compliance-report` |
| Deps | — (summary JSON shape local; contracts optional later) |

## Objective

Ship `packages/compliance-report` that turns an inspection summary JSON (findings counts, risk, `utility_id`) into a VoltPulse-branded HTML stub labeled toward PDF — minimal deps, tests + evidence.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/requirements.md` (detection enum, utility scoping)
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`
- Master: W06 Compliance PDF (`local-notes/05-roadmap-assumptions/06-master-execution-plan.md`)

## Allowed paths

- `packages/compliance-report/**`
- `task-cards/P0-T120/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only, optional)

Do **not** touch `apps/*`, audit/responsibility packages, or proprietary POC trees.

## Acceptance criteria

- [x] Package `packages/compliance-report` exists (README + module + CLI)
- [x] Accepts inspection summary JSON with `utility_id`, findings counts, risk
- [x] Emits HTML file stub clearly labeled as toward-PDF (stdlib OK; no heavy PDF deps required)
- [x] Unit tests cover happy path + validation errors
- [x] VoltPulse branding only; no internal product names
- [x] Evidence under `task-cards/P0-T120/evidence/`

## Validation

```bash
cd packages/compliance-report
python3 -m tests.test_render
python3 -m compliance_report fixtures/sample_summary.json /tmp/vp-compliance-stub.html
test -f /tmp/vp-compliance-stub.html
rg -n 'VoltPulse|toward PDF|utility_id' /tmp/vp-compliance-stub.html
rg -ni 'trinetra|t-netra|tnetra' packages/compliance-report && exit 1 || true
```

## Evidence

Write under `./evidence/` (commands + short output).

## Anti-leak

- [x] VoltPulse names only
- [x] Package name distinct: `compliance-report` (not audit/responsibility)
- [x] No proprietary paste / secrets

## Notes

- Distinct from W09 audit trail and responsibility-hint packages.
- HTML-to-PDF real renderer can replace stub later without changing summary JSON contract.
