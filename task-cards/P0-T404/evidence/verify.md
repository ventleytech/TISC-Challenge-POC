# P0-T404 evidence

## Commands

```bash
docker run --rm --entrypoint promtool \
  -v "$PWD/infra/obs/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
  prom/prometheus:v2.54.1 check config /etc/prometheus/prometheus.yml
cd apps/pulse-api && npm test -- --testPathPatterns=health
cd apps/pulse-gateway && npm test
cd apps/pulse-notify && npm test
```

## Results

- promtool: SUCCESS (prometheus.yml valid)
- pulse-api health tests pass; `/metrics` Public + excluded from `/api/v1` prefix
- gateway/notify tests pass; `/metrics` returns `vp_up`
- Compose obs: `prom/prometheus:v2.54.1` + `grafana/grafana:11.2.0` with mounts
- Targets: pulse-api:3000, pulse-notify:3010, pulse-gateway:3020, grid-perception:8081, grid-rules:8080

## Anti-leak

VoltPulse job names / labels only.
