# infra/obs — VoltPulse observability stubs

Profile **`obs`** (Compose T001): `pulse-prometheus`, `pulse-grafana`.

This tree holds **config fragments** only — not live images. Mount later from Compose when real Prometheus/Grafana images replace alpine sleep stubs.

| Path | Role |
|------|------|
| `prometheus/prometheus.yml` | Scrape job stubs for VoltPulse services |
| `grafana/provisioning/datasources/voltpulse.yml` | Prometheus datasource provisioning |

Planes: Sense / Media / Stream / Data — scrape labels use `vp_*` job names.
