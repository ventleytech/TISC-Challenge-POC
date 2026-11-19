# P0-T190 — Rules × responsibility (S9 finding hints)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master S9 / A04–A06) |
| Parallel | `ok` vs T130 glue scripts — branch from T020; do **not** touch `scripts/s2-detect-rules-smoke.sh` |
| Branch | `vp/P0-T190-rules-responsibility` |
| Deps | `P0-T020` grid-rules, `P0-T080` `@voltpulse/responsibility` |

## Objective

Merge responsibility + grid-rules onto one branch. When emitting findings, call `hintResponsibility` if asset OEM/warranty present on synthetic fixture; attach `party_type` / `warranty_hint` under `finding.extensions` (additive contract field).

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/requirements.md`
- `packages/contracts/events/findings/vp.findings.v1.schema.json`
- `packages/responsibility/README.md`
- `apps/grid-rules/README.md`
- Cards: `task-cards/P0-T020/CARD.md`, `task-cards/P0-T080/CARD.md`

## Allowed paths

- `apps/grid-rules/**`
- `packages/responsibility/**` (via cherry-pick; no behavior fork)
- `packages/contracts/events/findings/vp.findings.v1.schema.json` (optional `extensions` only)
- `task-cards/P0-T190/**`
- `docs/repo-structure.md` (one-line if missing)

Do **not** edit: `scripts/s2-detect-rules-smoke.sh`, `apps/grid-perception/**`, `apps/pulse-*`, proprietary trees under `local-notes/`.

## Acceptance criteria

- [x] Branch carries `@voltpulse/responsibility` + `apps/grid-rules` (from T080 + T020)
- [x] Synthetic `fixtures/assets.json` includes OEM/warranty fields
- [x] Findings with OEM/warranty asset get `extensions.party_type` + `extensions.warranty_hint`
- [x] Findings without OEM/warranty omit `extensions`
- [x] Contract schema allows optional `finding.extensions` (non-breaking)
- [x] Unit + smoke tests prove S9 attachment
- [x] Anti-leak: VoltPulse / `vp.*` / `grid-rules` only
- [x] Evidence under `./evidence/`

## Validation

```bash
cd packages/responsibility && npm install && npm test && npm run build
cd apps/grid-rules && npm install && npm test && npm run smoke
rg -ni 'trinetra|t-netra|tnetra' apps/grid-rules packages/responsibility && exit 1 || true
graphify update .
```

## Evidence

`./evidence/01-s9-responsibility-hints.md`

## Anti-leak

- [x] VoltPulse names only
- [x] Synthetic OEM / tender refs only
- [x] No proprietary warranty matrices

## Notes

- T130 owns detect→rules glue script only — leave untouched.
- Prefer `finding.extensions` over new required finding fields.
