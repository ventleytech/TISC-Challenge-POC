# P0-T260 — overnight integrate evidence

**Branch:** `vp/overnight-integrate`  
**Tip:** `62b631bb6e7dfd41d1c7b3fa7b8cd82756d43f79` (`62b631b`)  
**When:** 2026-11-18

## Merge order landed

| Order | Card / branch | Tip commit | Notes |
|------|----------------|------------|-------|
| 1 | T002 contracts | `0d1d875` | |
| 2 | T001 compose | `16e73e1` | |
| 3 | T110 MinIO+store+retention | `5353332` | supersedes T007/T070 |
| 4 | T090 kafka bootstrap | `e232e0a` | |
| 5 | T210 Kafka KRaft compose | `61efcd2` | real `pulse-bus` |
| 6 | T003→T004→T050→T140 api | `1f371c9` | |
| 7 | T006 notify | `8e038ed` | |
| 8 | T008 obs | `9dc97f6` | |
| 9 | T020 rules | `d83b8cd` | |
| 10 | T190 S9 responsibility | `ca32b71` | restored after T130 conflict |
| 11 | T180 alert-policy pkg | `e073d2f` | |
| 12 | T280 rules←alert-policy | `423faef` | after T190+T180 |
| 13 | T010/T130/T240 perception | `8fbfd68` | T240 after T130 |
| 14 | packages T080/T100/T120/T150/T160/T200/T220/T270 | various | |
| 15 | T030 train | `6e70172` | |
| 16 | T040 gateway | `d3b97ac` | |

## Deferred (pulse-web / T230)

- `vp/P0-T005-pulse-web` `0db34d6`
- `vp/P0-T060-schedule-assets-ui` `e74ee9c`
- `vp/P0-T170-priority-alerts-ui` `9950332`
- `vp/P0-T230-wow-ui` `9950332` (in_progress wow UI — do not overwrite)

No `apps/pulse-web` on integrate tip.

## Smoke

- `docker compose -f infra/compose/docker-compose.yml --project-name voltpulse config` → **OK**
- `pulse-api` jest → **19 passed**
- packages (offline-sync, i18n, responsibility, work-order, audit, prioritisation, geo-map, alert-policy) → **pass**
- `pulse-store`, `pulse-gateway`, `pulse-notify`, `pulse-train` → **pass**
- `detector-fallbacks` / `compliance-report` pytest → **pass**
- `grid-rules` → **15 passed** after `npm run build` in `packages/alert-policy` + `packages/responsibility` (dist not committed)
- `label-ui-stub` → no `npm test` script (smoke script only; not a merge blocker)

## Conflict notes

- Repeated AA on `task-plans/2026-11-18-gate0-and-p0-spine.md` — kept integrate-side / stripped markers.
- T130 vs T190 `grid-rules` — automatic `--theirs` dropped S9; fixed with restore commit then T280 kept both `@voltpulse/responsibility` + `@voltpulse/alert-policy`.
- T210 kafka fragment files took T210 versions.

## Anti-leak

Product paths clean except intentional negative asserts in tests (i18n / detector-fallbacks / perception).
