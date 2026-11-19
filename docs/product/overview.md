# TPulse — Overview

**Product:** TPulse (Infronex)  
**Challenge:** TISC Challenge 09 — Drone Based Monitoring (Energy)  
**Code folder:** packages under `pulse-*` / `@voltpulse/*`

## Intent

Drone / media survey of feeders, lines, substations. AI detects defects, ranks by **severity × criticality**, alerts (push/SMS + SLA), plus beyond-detection: asset intelligence, vendor mapping, scheduling, evidence governance, observability, and **automatic** continuous training.

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
| Realtime event plane | Kafka + Flink as **one** plane (ordered log + processing) |
| Single host today | Isolated Docker Compose — **Demo Day central** |
| Hybrid product | Sense on edge GPU *or* centre; Realtime/Apps stay central |
| Beyond detection | Assets, vendors, schedule, obs, auto-retrain, evidence tiers |

## Locked decisions (summary)

Alerts yes · Sag = conductor only · DeepStream OK · Thermal via public media until IR · Kafka+Flink real (one plane) · Nest+React real · Three-pillar observability · Automatic CT with eval gate · Evidence object store + retention · IP: TPulse-distinct ([`../anti-leak.md`](../anti-leak.md))

## Formal reading order

1. [`frd.md`](frd.md) — what  
2. [`../tdd.md`](../tdd.md) · [`../architecture.md`](../architecture.md) — how  
3. [`../observability.md`](../observability.md) · [`../retraining.md`](../retraining.md)  
4. [`feature-catalog.md`](feature-catalog.md) · [`../storage-retention.md`](../storage-retention.md)
