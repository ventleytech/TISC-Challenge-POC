# Architecture

**Posture:** final deployed architecture. Features phase; services, contracts, storage, observability, and retrain path do not require redesign. See `adr/0001-final-architecture-now.md`.

## Principles

1. Frames stop at perception — bus carries detections + short evidence, not continuous raw video to API.
2. One inference path — live, upload, thermal media → same worker contracts.
3. Nest (`pulse-api`) owns state — utilities, assets, inspections, findings, alerts, labels, holds.
4. Rules emit, Nest persists — Flink severity/SLA/notify emit; Nest is write authority.
5. Isolated Docker services now — single host; multi-box-ready profiles.
6. Evidence governed — object store; inspection-scoped / content-addressed IDs; retention tiers.
7. Observable by default — metrics/logs/traces per plane.
8. Retrain in the loop — labels → dataset → job → registry → perception reload.
9. Thermal now via public media ingest; IR camera later — same path.

## Stack (open names)

| Layer | Tech / service |
|-------|----------------|
| Stream gateway | MediaMTX-class (`pulse-gateway`) |
| Perception | DeepStream + TensorRT (`grid-perception`); ONNX fallback OK |
| Bus | Kafka (`pulse-bus`) |
| Rules | Flink (`grid-rules`) |
| Notify | Abstract adapter (`pulse-notify`) |
| API | NestJS (`pulse-api`) |
| Data | PostgreSQL (+ PostGIS optional), Redis optional |
| Object store | MinIO/S3 (`pulse-store`) |
| UI | React (`pulse-web`) |
| Observability | Prometheus + Grafana + Loki/Tempo-class |
| Train | `pulse-train` |

Topics: `vp.detect.*`, `vp.findings.*`, `vp.alerts.*`, `vp.labels.*`, `vp.models.*`.

## Planes ↔ Compose profiles

| Profile | Services | Future host |
|---------|----------|-------------|
| `sense` | `grid-perception` | GPU / Jetson-class |
| `media` | `pulse-gateway`, media helpers | Stream/media box |
| `stream` | Kafka, `grid-rules` | Stream-processing box |
| `data` | Nest, Postgres, Redis, notify, UI, train | Data-plane box |
| `obs` | Prometheus/Grafana/logs/traces | With data or dedicated |
| `store` | MinIO (`pulse-store`) | Shared object store |

## Ownership

| Owner | Writes |
|-------|--------|
| `grid-perception` | `vp.detect.*` + evidence objects |
| `grid-rules` | `vp.findings.*`, `vp.alerts.*` (emit) |
| `pulse-api` | Postgres authoritative state |
| `pulse-notify` | Channel delivery; receipts → API |
| `pulse-train` | Dataset artifacts; registry; `vp.models.*` |
| `pulse-web` | Nest only (no direct Kafka) |

Detail diagrams / extended notes: `local-notes/03-architecture/03-architecture.md`.
