# infra/compose

Docker Compose project **`voltpulse`**.

## Profiles

| Profile | Services |
|---------|----------|
| `sense` | `grid-perception` |
| `media` | `pulse-gateway` |
| `stream` | `pulse-bus` (Kafka), `pulse-kafka-topics`, `grid-rules` |
| `data` | `pulse-bus` (Kafka), `pulse-kafka-topics`, `pulse-postgres`, `pulse-api`, `pulse-web`, `pulse-notify`, `pulse-train` |
| `obs` | `pulse-prometheus`, `pulse-grafana` |
| `store` | `pulse-store` (MinIO), `pulse-store-buckets` (mc init) |

## Bus → Kafka (`pulse-bus`)

| Piece | Role |
|-------|------|
| Compose `pulse-bus` | Apache Kafka **4.1.0** KRaft (broker+controller); image already common on VoltPulse hosts |
| Listeners | `PLAINTEXT` → `pulse-bus:9092` (in-compose); `PLAINTEXT_HOST` → `localhost:${PULSE_KAFKA_HOST_PORT}` (host) |
| Compose `pulse-kafka-topics` | One-shot runs `infra/kafka/create-topics.sh` against catalog `vp.*` |
| Env | Root `.env.template` — `PULSE_KAFKA_*`, `PULSE_*_TOPIC`, `PULSE_TOPIC_*` (placeholders only) |

Topic bootstrap from host (no `kafka-topics` on PATH):

```bash
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env \
  --profile stream run --rm pulse-kafka-topics
# or dry-run:
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env \
  --profile stream run --rm --entrypoint /bin/bash pulse-kafka-topics \
  /work/infra/kafka/create-topics.sh --dry-run
```

See also `infra/kafka/README.md`.

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
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile stream config >/dev/null
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile store config >/dev/null
```

**Real images:** `store` → MinIO/mc; `stream`/`data` → Apache Kafka. Other services remain alpine/postgres stubs until their cards land. Pull only when you `up` (disk-sensitive).
