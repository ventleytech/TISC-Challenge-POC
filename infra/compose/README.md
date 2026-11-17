# infra/compose

Docker Compose project **`voltpulse`**.

## Profiles

| Profile | Services |
|---------|----------|
| `sense` | `grid-perception` |
| `media` | `pulse-gateway` |
| `stream` | `pulse-bus`, `grid-rules` |
| `data` | `pulse-postgres`, `pulse-api`, `pulse-web`, `pulse-notify`, `pulse-train` |
| `obs` | `pulse-prometheus`, `pulse-grafana` |
| `store` | `pulse-store` (MinIO), `pulse-store-buckets` (mc init) |

## Store → MinIO (`apps/pulse-store`)

| Piece | Role |
|-------|------|
| Compose `pulse-store` | MinIO server; API `${PULSE_STORE_API_PORT:-9000}`, console `${PULSE_STORE_CONSOLE_PORT:-9001}` |
| Compose `pulse-store-buckets` | One-shot `mc` create of `PULSE_STORE_BUCKETS` |
| Env | Root `.env.template` — `PULSE_STORE_*` (placeholder secrets only) |
| Client | `apps/pulse-store` with `PULSE_STORE_BACKEND=minio` and `PULSE_STORE_ENDPOINT=http://pulse-store:9000` (or `http://127.0.0.1:9000` from host) |

## Validate

```bash
cp .env.template .env   # local only; gitignored
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile data config >/dev/null
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile store config >/dev/null
```

Most profiles still use alpine/postgres placeholders; **`store` uses real MinIO/mc images** (pull only when you `up`).
