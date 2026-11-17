# P0-T008 — Observability stub (`infra/obs`)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master catalog T008) |
| Parallel | `ok` vs apps/* / M* (do not rewrite Compose) |
| Branch | `vp/P0-T008-obs` |
| Deps | T001 compose profiles (`obs`) preferred |

## Objective

Land a thin VoltPulse observability stub under `infra/obs/**`: Prometheus scrape config + Grafana datasource provisioning notes. Compose service shells stay owned by T001 — this card only adds config fragments.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`

## Allowed paths

- `infra/obs/**`
- `task-cards/P0-T008/evidence/**`
- `task-cards/P0-T008/CARD.md`

Do **not** edit `infra/compose/docker-compose.yml`, apps, or models.

## Acceptance criteria

- [x] `infra/obs/README.md` documents obs profile intent (Prometheus / Grafana)
- [x] Prometheus stub config present (`prometheus.yml`)
- [x] Grafana datasource stub present
- [x] VoltPulse service job names only (`pulse-*` / `grid-*`)
- [x] Evidence note with file list + anti-leak skim

## Validation

```bash
test -f infra/obs/prometheus/prometheus.yml
test -f infra/obs/grafana/provisioning/datasources/voltpulse.yml
rg -ni 'trinetra|t-netra|tnetra' infra/obs && exit 1 || true
```

## Evidence

`./evidence/01-obs-stub.md`

## Anti-leak

- [x] VoltPulse names only
- [x] No proprietary dashboards / scrape targets

## Notes

- Real image wires + dashboards = later card. Stub configs only.
