# @voltpulse/alert-policy

Shared VoltPulse policy helpers for **M05** (alert channel config) and **M06** (severity → SLA duration).

Consumers: `grid-rules` (emit `sla_due_at` + channels), `pulse-notify` (delivery), admin onboarding later. This package is config + pure helpers only — no SMS provider SDKs.

## Layout

```
alert-policy/
  config/default-policy.json   # Demo Day defaults
  src/                         # load, channels, sla
  test/
  .env.template
```

## Defaults (Demo Day)

| Severity | SLA minutes |
|----------|-------------|
| critical | 15 |
| high | 60 |
| medium | 240 |
| low | 1440 (1d) |
| info | 10080 (7d) |

Channels: `push` + `sms` enabled with `adapter: mock`; `email` off by default.

## Load

```ts
import { loadAlertPolicy, resolveChannels, slaDueAt } from '@voltpulse/alert-policy';

const policy = loadAlertPolicy(); // JSON + VP_ALERT_POLICY_* env
const channels = resolveChannels(policy);
const due = slaDueAt(occurredAt, 'critical', policy);
```

Env keys: see `.env.template`. Optional `VP_ALERT_POLICY_PATH` points at a custom JSON file.

## Commands

```bash
npm ci
npm test
npm run build
```
