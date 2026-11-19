# P0-T330 evidence — Kafka consumer → Postgres

Date: 2026-11-18 · base main `37d66eb`.

## Unit / build
```
cd apps/pulse-api && npx tsc --noEmit -p . && npm test && npm run build
# Test Suites: 8 passed · Tests: 32 passed (7 new in src/ingest)
```

## Live smoke (apache/kafka 4.1.0 pulse-bus, topics via pulse-kafka-topics, PostgresStore)
`./scripts/s2-kafka-ingest.sh` →
```
[s2-smoke] PASS mode=perception detections=5 findings=5 alerts=3 top_risk=30.94
ok findings=5 alerts=3 present via Kafka consumer
```
- `pulse-api-excerpt.txt`: `Using PostgresStore`, `Kafka consumer up: localhost:9094 … topics=vp.findings.v1,vp.alerts.v1`, 5× finding / 3× alert `ingested`.
- `psql-count.txt`: 5 findings | 3 alerts rows present in Postgres for published ids (rows deleted after smoke).
- `published.json`, `api-listed.json`, `findings-alerts.json`: ids + API readback via `GET /api/v1/{findings,alerts}`.

## Anti-leak
Topics `vp.*` only; service names `pulse-api` / `grid-rules` / `grid-perception`; no secrets (`.env` ignored; placeholder DB pw from template).
