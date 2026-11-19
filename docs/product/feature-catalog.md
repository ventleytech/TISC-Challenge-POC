# Feature catalog (slim)

Phase: **P0** Demo Day · **P1** build window · **P2** pilot.

## Core

| ID | Feature | Phase |
|----|---------|-------|
| C01 | Live RTSP/RTMP | P0/P1 |
| C02 | Record-then-upload (MP4) | P0 |
| C03 | Shared inference contract (live = upload) | P0 |
| C04 | Five detectors | P0/P1 |
| C05 | Evidence crop/clip | P0 |
| C06 | Severity + recommendations | P0 |
| C07 | Push/SMS + SLA + ack | P0 |
| C08 | History | P0 |
| C09 | Prioritisation board | P0/P1 |
| C10 | Auth + Energy roles | P0 |

## Beyond detection

| ID | Feature | Phase |
|----|---------|-------|
| A01–A03 | Asset registry + criticality/geo | P0 schema / P1 |
| A04 | Responsible-party hint | P1 |
| S01–S05 | Schedule + lifecycle (Scheduled → In progress → Review → Closed) | P0/P1 |
| M01–M02 | Utility onboarding + RBAC | P0/P1 |
| O01 | Infra obs (Prom/Grafana health strip) | P0/P1 |
| O02 | Model/data obs (FiftyOne/Evidently) | P1/P2 |
| O03 | AI reasoning obs (Phoenix) + OTel join | P1/P2 |
| O04 | Human labels → FiftyOne/CVAT | P1 |
| O05 | Auto retrain triggers (volume/drift/cron) | P1/P2 |
| O06 | ClearML eval gate + registry | P1/P2 |
| O07 | Canary activate + Sense/edge reload | P2 |
| E01–E04 | Object store + retention + hold | P0/P1 |
| H01 | Hybrid Sense (edge \| central) — Demo central | P0 story / P2 field |

Full FRD: [`frd.md`](frd.md).
