# P0-T090 — Kafka bootstrap stub (`vp.*` from catalog)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ overnight master catalog) |
| Parallel | `ok` vs apps/* / T001 (fragment only; no main compose rewrite) |
| Branch | `vp/P0-T090-kafka-bootstrap` |

## Objective

Ship `infra/kafka` create-topics stub that reads `packages/contracts/events/catalog.yaml` and can dry-run / list VoltPulse `vp.*` topics; optional Compose fragment referencing `data`/`stream` without owning `docker-compose.yml`.

## Input docs

- `docs/architecture.md` — Kafka as `pulse-bus`; `vp.*` families
- `docs/anti-leak.md` — VoltPulse topic prefix only
- `packages/contracts/events/catalog.yaml` — topic source of truth
- `infra/compose/README.md` — profiles (`stream` bus, `data` consumers)

## Allowed paths

- `infra/kafka/**`
- `packages/contracts/**` (cherry-pick / reference catalog only)
- `task-cards/P0-T090/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only, optional)

## Acceptance criteria

- [x] `infra/kafka/create-topics.sh` reads catalog; `--help`, `--list`, `--dry-run` work
- [x] Topics listed are VoltPulse `vp.*` only (script rejects others)
- [x] README documents usage + optional compose fragment
- [x] Compose fragment does not rewrite `infra/compose/docker-compose.yml`
- [x] Evidence under `./evidence/` with help + listed topics / dry-run

## Validation

```bash
./infra/kafka/create-topics.sh --help
./infra/kafka/create-topics.sh --list
./infra/kafka/create-topics.sh --dry-run
# optional if compose present:
# docker compose -p voltpulse -f infra/compose/docker-compose.yml \
#   -f infra/kafka/compose.fragment.yml --profile stream --profile data config >/dev/null
```

## Evidence

Write under `./evidence/` (markdown notes OK).

## Anti-leak

- [x] VoltPulse / `vp.*` names only
- [x] No proprietary topic catalogs or internal brand strings

## Notes

- Dep: contracts catalog (cherry-pick P0-T002 commit if missing on branch).
- Avoid `apps/*`, `models-experiments`, proprietary trees.
- Do not fight T001 for main Compose ownership — fragment only.
