# infra/obs — VoltPulse observability

Profile **`obs`**: real Prometheus + Grafana (P0-T404).

| Path | Role |
|------|------|
| `prometheus/prometheus.yml` | Scrape `pulse-api`, `pulse-notify`, `pulse-gateway`, `grid-perception`, `grid-rules` `/metrics` |
| `grafana/provisioning/datasources/voltpulse.yml` | Datasource → `http://pulse-prometheus:9090` |

```bash
# from infra/compose
docker compose --profile obs up -d pulse-prometheus pulse-grafana
# validate config
docker run --rm -v "$PWD/../obs/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro" \
  prom/prometheus:v2.54.1 promtool check config /etc/prometheus/prometheus.yml
```

Targets only scrape when those services are on the Compose network (bring matching profiles).
