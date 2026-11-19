# P0-T404 — Prometheus real scrapes + Grafana

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | cost-efficient remaining build |
| Parallel | `no` |
| Branch | `main` |

## Objective

Replace alpine obs stubs with real Prometheus + Grafana; scrape VoltPulse `/metrics`.

## Allowed paths

- `infra/obs/**`
- `infra/compose/docker-compose.yml`
- `apps/pulse-api/src/health/**`
- `apps/grid-rules/src/serve.ts`
- `apps/pulse-gateway/src/server.ts`
- `apps/pulse-notify/src/server.ts`
- `apps/grid-perception/grid_perception/serve.py`
- `task-cards/P0-T404/**`

## Acceptance criteria

- [x] Compose obs uses real Prometheus/Grafana images + mounts
- [x] `/metrics` on api, rules, gateway, notify, perception
- [x] prometheus.yml targets correct ports
- [x] Grafana datasource provisioning to pulse-prometheus
- [x] evidence: config curl / promtool check or compose config validate

## Evidence

`./evidence/verify.md`
