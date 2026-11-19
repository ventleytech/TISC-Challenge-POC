# P0-T220 evidence — O04 label stub → pulse-train

**Branch:** `vp/P0-T220-label-ui-stub`  
**Date:** 2026-11-18  
**Base:** `0d1d875` (contracts)  
**Train used:** `/home/ubuntu/voltpulse-P0-T030/apps/pulse-train` (`P0-T030` @ `6e70172`)

## Delivered

```
packages/label-ui-stub/
  README.md package.json
  static/index.html   # TP/FP form → POST /internal/consume

scripts/smoke-o04-labels.sh
task-cards/P0-T220/{CARD.md,evidence/}
```

No `apps/pulse-web` edits (T170 still active).

## Smoke

```bash
cd /home/ubuntu/voltpulse-P0-T220
PULSE_TRAIN_ROOT=/home/ubuntu/voltpulse-P0-T030/apps/pulse-train ./scripts/smoke-o04-labels.sh
```

Abridged:

```
== health ==
{"status":"ok","service":"pulse-train","labelsTopic":"vp.labels.v1",...}

== TP POST → 202 ==
{"id":"...","topic":"vp.labels.v1","kind":"tp","class_id":"corrosion","queueSize":1}

== FP POST → 202 ==
{"id":"...","topic":"vp.labels.v1","kind":"fp","class_id":"crack","queueSize":2}

O04 smoke OK (TP+FP → http://127.0.0.1:<ephemeral>)
```

## Anti-leak

```bash
rg -ni 'trinetra|t-netra|tnetra' packages/label-ui-stub scripts/smoke-o04-labels.sh
# no matches
```

## Notes

- Spine plan `task-plans/2026-11-18-gate0-and-p0-spine.md` not on this branch base; row add deferred to merge onto tip that has the plan.
- Static form is file:// / static-server only; product UI remains a later pulse-web card.

## Re-verify (parent parse)

```
PULSE_TRAIN_ROOT=/home/ubuntu/voltpulse-P0-T030/apps/pulse-train ./scripts/smoke-o04-labels.sh
# → TP POST 202, FP POST 202, O04 smoke OK
# anti-leak: no matches
```
