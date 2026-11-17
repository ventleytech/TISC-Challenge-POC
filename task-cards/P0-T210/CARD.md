# P0-T210 — Compose data/stream bus → real Kafka (KRaft)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ overnight master catalog) |
| Parallel | `no` vs other compose editors; sole owner of `pulse-bus` / Kafka env keys |
| Branch | `vp/P0-T210-kafka-compose` |
| Deps | `P0-T001` (compose), `P0-T090` (create-topics), `P0-T110` (MinIO compose base) |

## Objective

Upgrade Compose profiles `stream` / `data` so `pulse-bus` is a real Apache Kafka KRaft broker (not alpine stub), keep env keys as `.env.template` placeholders only, and wire `infra/kafka/create-topics.sh` (via `pulse-kafka-topics`) against that bus.

## Input docs

- `docs/architecture.md` — Kafka as `pulse-bus`; `vp.*` families
- `docs/anti-leak.md`
- `infra/compose/README.md`
- `infra/kafka/README.md` (P0-T090)
- `packages/contracts/events/catalog.yaml`

## Allowed paths

- `infra/compose/**`
- `infra/kafka/**`
- `.env.template` (Kafka / topic keys only + preserve existing)
- `task-cards/P0-T210/**`
- `task-cards/P0-T090/**` (bring-forward only if merging branch)
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only, optional)

Do **not** edit `apps/*`. No real secrets. Live `up` optional if disk tight — `docker compose … config` is enough.

## Acceptance criteria

- [x] `pulse-bus` uses a real Kafka image (Apache KRaft or Bitnami) — not alpine stub
- [x] `pulse-bus` available under profiles `stream` and `data`
- [x] Kafka-related env documented in `.env.template` (placeholders only)
- [x] `create-topics.sh` wired or documented against Compose bus (`pulse-kafka-topics` and/or README)
- [x] `docker compose … --profile data|stream config` validates
- [x] Evidence under `./evidence/`
- [x] Anti-leak clean on touched paths

## Validation

```bash
cp -n .env.template .env
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile data config >/dev/null
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile stream config >/dev/null
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile data config \
  | rg -n 'apache/kafka|pulse-bus|pulse-kafka-topics|CLUSTER_ID|PULSE_KAFKA'
./infra/kafka/create-topics.sh --list
rg -ni 'trinetra|t-netra|tnetra' infra/compose infra/kafka .env.template && exit 1 || true
```

## Evidence

Write under `./evidence/` (commands + short output).

## Anti-leak

- [x] VoltPulse / `vp.*` / `voltpulse` / `pulse-bus` only
- [x] No real secrets; template placeholders only
- [x] Never commit `.env`

## Notes

- Base: T110 @ `5353332` + cherry-pick T090 `infra/kafka` @ `e232e0a`.
- Image: `apache/kafka:4.1.0` (local host cache; KRaft combined roles).
- Live broker `up` + topic create proven; torn down after evidence (disk ~26G free).
