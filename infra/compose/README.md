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
| `store` | `pulse-store` |

## Validate

```bash
cp .env.template .env   # local only; gitignored
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile data config >/dev/null
```

Stub containers use alpine/postgres placeholders until service cards ship images.
