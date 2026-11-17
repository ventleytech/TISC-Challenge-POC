# Submission form text (≤1500 characters)

Brand: **VoltPulse** only. Count: Unicode code points.

## Primary (1461 / 1500)

```
VoltPulse is Ventley's AI inspection platform for drone surveys of feeders, lines, and substations—built beyond detection alone. Operators schedule asset-type inspections and run live RTSP/RTMP pull or record-then-upload; both share one perception path and finding contracts.

NVIDIA DeepStream detects crack, conductor sag, corrosion, vegetation, and thermal hotspots with evidence clips. Until IR hardware arrives, thermal uses public datasets via the same upload ingest. An asset registry holds OEM, warranty/SLA, criticality, and geo so findings map to likely responsible parties and risk scores.

Apache Kafka carries detections. Apache Flink applies severity×criticality, dedupe, and SLA timers, then raises push/SMS alerts with operator acknowledge. NestJS owns utilities, sites, inspections, findings, alerts, and labels. React UI covers schedule, live/upload, ranked findings, filters, alert ack, and admin onboarding.

Deploy is a single-host Compose of isolated services—Sense (DeepStream), Media (gateway + object store), Stream (Kafka/Flink), Data (Nest/Postgres/UI)—ready to split across hosts without redesign. Observability tracks pipeline health, model latency, Kafka lag, and alert delivery; evidence uses retention tiers; operator labels feed a retrain loop into a model registry.

Models: open GitHub fine-tunes and public datasets first. Live drone optional for evaluators; recorded/public media suffice; Demo Day live stretch if requested.
```

Verify: `python3 -c "print(len('''…'''))"`
