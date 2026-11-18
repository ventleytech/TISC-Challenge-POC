# infra/kafka

Bootstrap **VoltPulse** Kafka topics (`vp.*`) from `packages/contracts/events/catalog.yaml`.

## Script

```bash
# Help
./infra/kafka/create-topics.sh --help

# List catalog topics (no broker needed)
./infra/kafka/create-topics.sh --list

# Print create commands (no broker / CLI needed)
./infra/kafka/create-topics.sh --dry-run

# Live create (needs kafka-topics on PATH + reachable broker)
PULSE_KAFKA_BOOTSTRAP=localhost:9094 ./infra/kafka/create-topics.sh
```

Catalog path defaults to repo `packages/contracts/events/catalog.yaml` (P0-T002). Override with `--catalog` or `PULSE_TOPIC_CATALOG`.

Script **refuses** any topic name that does not start with `vp.`.

Catalog parse: `python3`+PyYAML when available; **awk fallback** for Apache Kafka admin containers (no Python).

## Against Compose Kafka (P0-T210)

Main compose (`infra/compose/docker-compose.yml`) runs:

- `pulse-bus` — Apache Kafka 4.1.0 KRaft under profiles **`stream`** and **`data`**
- `pulse-kafka-topics` — one-shot wrapper around this script (waits for healthy bus)

```bash
cp -n .env.template .env
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env \
  --profile stream --profile data config >/dev/null

# Create topics (starts bus if needed when using up; or run one-shot):
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env \
  --profile stream up -d pulse-bus
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env \
  --profile stream run --rm pulse-kafka-topics
```

Host bootstrap (after bus is up): use `PULSE_KAFKA_BOOTSTRAP=localhost:${PULSE_KAFKA_HOST_PORT:-9094}` so metadata returns the `PLAINTEXT_HOST` listener.

## Compose fragment

`compose.fragment.yml` is a **legacy overlay** for pre-T210 alpine `pulse-bus`. Prefer the services already in `infra/compose/docker-compose.yml`. Do **not** stack the fragment on top of T210 main compose (duplicate `pulse-kafka-topics`).

## Topics (catalog stub)

| Topic | Producer |
|-------|----------|
| `vp.detect.v1` | `grid-perception` |
| `vp.findings.v1` | `grid-rules` |
| `vp.alerts.v1` | `grid-rules` |
| `vp.labels.v1` | `pulse-api` |
| `vp.models.v1` | `pulse-train` |
| `vp.dlq.v1` | `pulse-api` (dead-letter of skipped ingest messages; added by `create-topics.sh`, not in catalog) |

DLQ record: JSON `{dlq_version, reason: non_json|rejected|unexpected_topic, detail, source_topic, partition, offset, failed_at, payload}`. Enable with `PULSE_KAFKA_DLQ_ENABLED=true`; set `PULSE_KAFKA_DLQ_FILE` to append JSONL instead of producing.
