# P0-T005 — `pulse-web` shell + VoltPulse brand

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs M* / T001 / T002 |
| Branch | `vp/P0-T005-pulse-web` |
| Deps | — (optional later: ui-tokens polish) |

## Objective

Scaffold `apps/pulse-web` (and minimal `packages/ui-tokens` if needed) so the first viewport clearly brands **VoltPulse** with empty route shells — no dashboard fake data, no proprietary UI chrome.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/overview.md` (if present)
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `apps/pulse-web/**`
- `packages/ui-tokens/**`
- `task-cards/P0-T005/evidence/**`
- `task-cards/P0-T005/CARD.md` (status flip only)

Do not call real Nest APIs beyond optional health placeholder; no copy of internal UI kits.

## Acceptance criteria

- [x] App boots (dev or build) under `apps/pulse-web/`
- [x] Brand **VoltPulse** is hero-level on first viewport (not nav-only)
- [x] Empty shells/routes for inspections / assets / alerts (stubs OK)
- [x] Theme tokens live under `packages/ui-tokens/` or documented CSS variables in-app
- [x] Anti-leak: no internal brand strings; no proprietary chrome paste
- [x] Evidence: build/dev cmd + screenshot path or browser snapshot note

## Validation

```bash
# adjust package manager to scaffold
cd apps/pulse-web && npm run build
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-web packages/ui-tokens && exit 1 || true
graphify update .
```

## Evidence

Write under `./evidence/` (e.g. `01-web-shell.md`). Screenshot blobs gitignored; note path.

## Anti-leak

- [x] VoltPulse brand first
- [x] Fresh UI — conceptual Energy inspection OS, not cloned chrome

## Notes

- Safe parallel overnight; lower priority than M001→M002→T002.
- Frontend design: avoid generic purple-on-white AI defaults; keep shell minimal.
