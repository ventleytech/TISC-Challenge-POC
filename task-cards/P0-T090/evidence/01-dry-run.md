# P0-T090 evidence — create-topics help / list / dry-run

Host: worktree `/home/ubuntu/voltpulse-P0-T090` branch `vp/P0-T090-kafka-bootstrap`  
Date: 2026-11-18  
Catalog: `packages/contracts/events/catalog.yaml` (cherry-picked from P0-T002 `0d1d875`)

## Commands

```bash
./infra/kafka/create-topics.sh --help
./infra/kafka/create-topics.sh --list
./infra/kafka/create-topics.sh --dry-run
```

## `--list` output

```
vp.detect.v1
vp.findings.v1
vp.alerts.v1
vp.labels.v1
vp.models.v1
```

## `--dry-run` (excerpt)

```
catalog:   .../packages/contracts/events/catalog.yaml
bootstrap: localhost:9092
topics:    5

[dry-run] kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic vp.detect.v1 --partitions 1 --replication-factor 1
[dry-run] kafka-topics.sh ... --topic vp.findings.v1 ...
[dry-run] kafka-topics.sh ... --topic vp.alerts.v1 ...
[dry-run] kafka-topics.sh ... --topic vp.labels.v1 ...
[dry-run] kafka-topics.sh ... --topic vp.models.v1 ...

dry-run complete; no topics created
```

## Notes

- No live broker required for this card; stub `pulse-bus` (T001) is alpine until real Kafka image.
- Compose fragment `infra/kafka/compose.fragment.yml` profiles: `stream`, `data` — does not rewrite T001 `docker-compose.yml`.
- `infra/compose/` absent on this branch (T001 not merged); fragment validated by file presence + README wiring.

## Anti-leak skim

- Topics all `vp.*`; services `pulse-*` / `grid-*`; project `voltpulse`.
- No internal product brand strings in `infra/kafka/**`.
