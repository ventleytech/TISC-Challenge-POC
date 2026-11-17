# P0-T008 evidence — infra/obs stub

Branch: `vp/P0-T008-obs`  
Worktree: `/home/ubuntu/voltpulse-P0-T008`

## Files

- `infra/obs/README.md`
- `infra/obs/prometheus/prometheus.yml` — jobs: `vp_pulse_api`, `vp_pulse_notify`, `vp_grid_perception`, `vp_grid_rules`
- `infra/obs/grafana/provisioning/datasources/voltpulse.yml`

## Validation

```bash
test -f infra/obs/prometheus/prometheus.yml
test -f infra/obs/grafana/provisioning/datasources/voltpulse.yml
rg -ni 'trinetra|t-netra|tnetra' infra/obs || true
```

All present; anti-leak rg clean. Compose not modified (T001 owns `docker-compose.yml`).
