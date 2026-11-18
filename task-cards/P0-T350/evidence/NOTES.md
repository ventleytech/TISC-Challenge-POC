# P0-T350 notes

## Design (right-sized)
- `apps/pulse-api/src/evidence/`: `ObjectBackend` (memory | fs | minio) + `EvidenceService` + controller. MinIO via the `minio` npm client (optionalDependency, dynamic import) — same env keys as `apps/pulse-store`. pulse-store is ESM-only/unbuilt, pulse-api is CJS, so the ~10-line key layout is mirrored rather than imported.
- Object + `<key>.meta.json` sidecar per evidence. In-process index warms from sidecars (single replica ceiling, `ponytail:` comment; upgrade = Postgres table).
- id = `ev_` + sha256(inspection_id \0 bytes)[:12] → idempotent re-post, no cross-inspection collisions.
- Signed content URL = HMAC(`id.exp`) with `PULSE_EVIDENCE_SIGNING_SECRET`; works for any backend, lets `<img>` load without an API key.
- CORS added (`PULSE_API_CORS_ORIGINS`, off when empty) — without it live mode from a browser dev server cannot send `X-API-Key`. JSON body limit raised to ~1.4× `PULSE_EVIDENCE_MAX_BYTES` (base64).

## Live vs mock
| Piece | State |
|---|---|
| pulse-api → MinIO put/get/list | LIVE (verified vs real MinIO server) |
| `/api/v1/evidence*` + OpenAPI | LIVE |
| pulse-web Evidence page | LIVE when API reachable (even if empty); MOCK vault (19 objects, procedural art) otherwise |
| Real crop producer (grid-rules/perception → POST /evidence) | NOT wired — `scripts/seed-evidence.py` seeds procedural crops; producer wiring is a follow-up card |
| Retention transitions | `hot` only at create; warm/expire/legal_hold values shown from mock / pulse-store retention, not driven by this API yet |
| Finding link | `finding_id` stored/shown; findings `evidence_object_ids` not auto-filled |

## Blockers / findings
- **`minio/minio:RELEASE.2025-04-22T22-12-26Z` (pinned in `infra/compose/docker-compose.yml`) is no longer pullable** — Docker Hub and quay.io both return `pull access denied` / 401 for `minio/minio` and `quay.io/minio/minio`. Smoke used `bitnamilegacy/minio:latest` (real MinIO server, 2025-05-24 build) run ad hoc on 127.0.0.1:19000. **Resolved by P0-T371** (compose now pins `bitnamilegacy/minio:2025.4.22@sha256:…`).
- `PULSE_STORE_BACKEND=fs` in `.env.template` means pulse-api would write `./.pulse-store-data` when run from env template; set `minio` for the store profile.
- Pre-existing: `settings.spec.ts` has 2 prettier lint errors (untouched).
