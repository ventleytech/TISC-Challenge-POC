# P0-T001 evidence — Compose skeleton

Date: 2026-11-18  
Branch: `vp/P0-T001-compose`

## Commands

```bash
test -f .env.template
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env.template --profile data config >/dev/null
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env.template --profile data config --services
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env.template \
  --profile sense --profile media --profile stream --profile data --profile obs --profile store \
  config --services
rg -ni 'trinetra|t-netra|tnetra' infra/compose .env.template && exit 1 || true
graphify update .
```

## Results

- Project `name: voltpulse` — pass
- `--profile data config` — OK (101 lines rendered)
- Data services: `pulse-postgres`, `pulse-api`, `pulse-web`, `pulse-notify`, `pulse-train`
- All profiles services present: `grid-perception`, `pulse-gateway`, `pulse-bus`, `grid-rules`, data set, `pulse-prometheus`, `pulse-grafana`, `pulse-store`
- Anti-leak grep: **no matches**
- Stub images: alpine/postgres placeholders (no proprietary chrome)

## Notes

Validation used `--env-file .env.template` (no real `.env` committed). Copy locally for up.
