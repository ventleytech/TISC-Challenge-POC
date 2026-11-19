# P0-T335 smoke: grid-rules -> vp-pulse-bus

## unit tests
```
ℹ tests 17
ℹ pass 17
ℹ fail 0
```
## no-op (flag unset)
```
    "findings": 3,
    "alerts": 2,
    "kafka_published": 0,
```
## live publish
```
before: vp.findings.v1:0:5 | vp.alerts.v1:0:3
    "findings": 3,
    "alerts": 2,
    "kafka_published": 5,
after:  vp.findings.v1:0:8 | vp.alerts.v1:0:5
--- consumed sample (findings)
null	{"event_id":"08a140df-900b-4e60-b4fe-a3ae663de1f1","occurred_at":"2026-11-17T23:50:51Z","inspection_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","finding":{"finding_id":"14b6852e-12d9-4621-be72-d1f6bf898f08","class_id":"corrosion","severity":"low","risk_score":30.94,"asset_id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","source_detection_ids":["564fec5e-568b-4a79-a99a-81227ecd8029"],"evidence_object_ids":[],"extensions":{"party_type":"oem","warranty_hint":"warranty_breach_suspect","tender_ref":"VP-TENDER-SYN-001"}}}
Processed a total of 1 messages
--- consumed sample (alerts)
null	{"event_id":"41e15701-2dc9-4035-af63-262a08534575","occurred_at":"2026-11-17T23:50:51Z","alert":{"alert_id":"d0bbf007-0309-48d5-b270-15e2c6043ec5","finding_id":"14b6852e-12d9-4621-be72-d1f6bf898f08","inspection_id":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","utility_id":"11111111-1111-4111-8111-111111111111","severity":"low","sla_due_at":"2026-11-18T23:50:51.000Z","channels":["push","sms"]}}
Processed a total of 1 messages
```
## enabled but no brokers
```
[grid-rules] GRID_RULES_KAFKA_PRODUCER_ENABLED=true but KAFKA_BROKERS unset — kafka publish skipped
    "kafka_published": 0,
```
