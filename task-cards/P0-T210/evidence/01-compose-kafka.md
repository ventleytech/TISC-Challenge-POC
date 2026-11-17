# P0-T210 evidence — real Kafka on stream/data

Branch: `vp/P0-T210-kafka-compose`  
Base: T110 `5353332` + cherry-pick T090 kafka tree `e232e0a`  
Image: `apache/kafka:4.1.0` (KRaft broker+controller; already cached on host)

## Config validation

```bash
cp -n .env.template .env
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env \
  --profile data config >/dev/null
# → DATA_CONFIG_OK

docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env \
  --profile stream config >/dev/null
# → STREAM_CONFIG_OK
```

Rendered services (both profiles):

- `pulse-bus` → `image: apache/kafka:4.1.0`, `CLUSTER_ID` from `PULSE_KAFKA_CLUSTER_ID`
- `pulse-kafka-topics` → same image; runs `infra/kafka/create-topics.sh`

## Topic catalog (host)

```text
$ ./infra/kafka/create-topics.sh --list
vp.detect.v1
vp.findings.v1
vp.alerts.v1
vp.labels.v1
vp.models.v1
```

## Live smoke (optional; disk OK)

```bash
docker compose … --profile stream up -d pulse-bus
# health → healthy (~10s)

docker compose … --profile stream run --rm pulse-kafka-topics
# Created topic vp.detect.v1 / vp.findings.v1 / vp.alerts.v1 / vp.labels.v1 / vp.models.v1

docker compose … exec pulse-bus kafka-topics.sh --bootstrap-server localhost:9092 --list
# vp.alerts.v1 vp.detect.v1 vp.findings.v1 vp.labels.v1 vp.models.v1
```

Torn down after smoke (`stop`/`rm` + `docker volume rm voltpulse_pulse_kafka_data`).

## create-topics vs Kafka image

Apache Kafka image has no `python3`. Script gained **awk fallback** for catalog `name: vp.*` lines so `pulse-kafka-topics` works in-container; host still prefers python3+PyYAML.

## Anti-leak

`rg -ni 'trinetra|t-netra|tnetra' infra/compose infra/kafka .env.template` → no hits.  
No real secrets; `.env` gitignored / not committed.

## How clients reach the bus

| Client | Bootstrap |
|--------|-----------|
| In-compose | `PULSE_KAFKA_BOOTSTRAP=pulse-bus:9092` |
| Host | `localhost:${PULSE_KAFKA_HOST_PORT:-9094}` (`PLAINTEXT_HOST`) |
