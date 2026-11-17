# VoltPulse — Overview

**Product:** VoltPulse  
**Challenge:** TISC Challenge 09 — Drone Based Monitoring (Energy)  
**Folder:** `challenge/voltpulse/`

## Intent

Drone / media survey of feeders, lines, substations. AI detects defects, ranks by **severity × criticality**, alerts (push/SMS + SLA), plus beyond-detection: asset intelligence, vendor mapping, scheduling, evidence governance, observability, retrain loops.

| Detection | Meaning |
|-----------|---------|
| Crack | Structural / insulator / hardware |
| Sag | Conductor sag beyond clearance (not vibration) |
| Corrosion | Rust / coating failure |
| Vegetation | Encroachment / ROW |
| Thermal hotspot | Abnormal heat (public IR media for demo; camera later) |

## Architecture posture (locked)

| Principle | Meaning |
|-----------|---------|
| Final architecture now | Features phase; services/contracts/storage do not redesign |
| Single host today | Isolated Docker services |
| Multi-box ready | Compose profiles → Sense / Media / Stream / Data |
| Beyond detection | Assets, vendors, schedule, obs, retrain, evidence tiers |

## Locked decisions (summary)

Alerts yes · Sag = conductor only · DeepStream OK · Thermal via public media until IR · Kafka+Flink real · Nest+React real · Observability in arch · Retrain loop in arch · Evidence object store + retention · IP: VoltPulse-distinct (`docs/anti-leak.md`)

Longer discussion: `local-notes/` (gitignored).
