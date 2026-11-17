# Repo structure

Target monorepo. **Do not** mirror internal product trees 1:1.

```
voltpulse/
  AGENTS.md
  apps/
    pulse-gateway/       # profile: media
    grid-perception/     # profile: sense
    grid-rules/          # profile: stream
    pulse-notify/        # profile: data
    pulse-api/           # profile: data
    pulse-web/           # profile: data
    pulse-train/         # profile: data
    pulse-store/         # profile: store (object-store client / evidence IDs)
  packages/
    contracts/           # OpenAPI + vp.* events
    ui-tokens/
    shared-ts/
  infra/
    compose/             # profiles: sense|media|stream|data|obs|store
    obs/
    scripts/
  models/                # open weight pointers + model cards
  datasets/              # public manifests
  docs/                  # formal only
  task-plans/
  task-cards/
  scripts/               # SDD / graphify helpers
  local-notes/           # gitignored discussions
  .cursor/rules|skills/
```

Contracts: `packages/contracts/events/` + `openapi/`. Never import proprietary contract JSON.
