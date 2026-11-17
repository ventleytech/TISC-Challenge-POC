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
PULSE_KAFKA_BOOTSTRAP=localhost:9092 ./infra/kafka/create-topics.sh
```

Catalog path defaults to repo `packages/contracts/events/catalog.yaml` (P0-T002). Override with `--catalog` or `PULSE_TOPIC_CATALOG`.

Script **refuses** any topic name that does not start with `vp.`.

## Compose fragment

`compose.fragment.yml` adds `pulse-kafka-topics` under profiles **`stream`** and **`data`**. It does **not** rewrite `infra/compose/docker-compose.yml` (owned by P0-T001).

`pulse-bus` lives under profile `stream`. Data-plane services (`pulse-api`, etc.) consume the same `vp.*` topics once created.

```bash
docker compose -p voltpulse \
  -f infra/compose/docker-compose.yml \
  -f infra/kafka/compose.fragment.yml \
  --profile stream --profile data \
  config >/dev/null
```

Live topic create against stub alpine `pulse-bus` will fail until a real Kafka image lands — use `--dry-run` / `--list` for validation today.

## Topics (catalog stub)

| Topic | Producer |
|-------|----------|
| `vp.detect.v1` | `grid-perception` |
| `vp.findings.v1` | `grid-rules` |
| `vp.alerts.v1` | `grid-rules` |
| `vp.labels.v1` | `pulse-api` |
| `vp.models.v1` | `pulse-train` |
