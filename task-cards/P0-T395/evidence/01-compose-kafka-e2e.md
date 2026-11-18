# P0-T395 evidence — compose Kafka E2E (2026-11-18)

Command: `./scripts/s2-compose-kafka-e2e.sh` (gateway) and `VP395_NO_BUILD=1 VP395_SYNTHETIC=1 VP395_EVIDENCE_DIR=.../evidence/synthetic ./scripts/s2-compose-kafka-e2e.sh`.

| Mode | Result |
|------|--------|
| gateway | `PASS ... findings=1 alerts=1 notify_lines=2` (api_f=1 api_a=1) |
| synthetic | `PASS ... findings=1 alerts=1 notify_lines=2` |

- grid-rules `/health` before: `inputs.kafka=true outputs.kafka=true outputs.http=false`.
- Teardown `down -v` for `vp395`; `docker volume ls | rg vp395` empty afterwards.
- Default stack `vp-pulse-bus` / `vp-pulse-postgres` stayed up; MinIO image digests unchanged (`bitnamilegacy/minio:2025.4.22@sha256:50cec18a…`, `minio-client@sha256:8a86e441…`).
