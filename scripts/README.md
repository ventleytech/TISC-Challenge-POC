# scripts/

| Script | Purpose |
|--------|---------|
| `graphify-init.sh` | `graphify cursor install` + optional `graphify update .` |
| `card-status.sh` | Print status of `task-cards/*/CARD.md` |
| `s2-rules-kafka-api-e2e.sh` | P0-T336: grid-rules Kafka producer → pulse-api consumer → store → API (memory, or Postgres via `PULSE_DATABASE_URL`) |
| `s2-compose-bus-e2e.sh` | P0-T390/T393: Compose project `vp393` — gateway frame → shared file bus → grid-rules → (in-container HTTP sink) → pulse-api + Postgres; script only reads, no Kafka; `down -v` on exit |

rtk: if installed, prefer `rtk git …` / `rtk ls …` in agent shells (see `.cursor/rules/70-tooling-rtk-caveman.mdc`).
