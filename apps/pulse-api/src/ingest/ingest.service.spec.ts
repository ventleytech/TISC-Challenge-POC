import { MemoryStore } from '../domain/memory.store';
import {
  IngestRejectedError,
  IngestService,
  type AlertsEvent,
  type FindingsEvent,
} from './ingest.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { loadSettings } from '../config/settings';

const UTIL = '11111111-1111-4111-8111-111111111111';
const FID = '3cff6d04-893d-4c7d-b854-b6bdc54eef19';
const AID = '161a93c3-a792-4730-8700-977f555ce487';

const findingEvent: FindingsEvent = {
  event_id: 'db828007-db34-4c51-a942-6ee47f22675a',
  occurred_at: '2026-11-18T00:00:00Z',
  inspection_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  finding: {
    finding_id: FID,
    class_id: 'corrosion',
    severity: 'low',
    risk_score: 30.9,
  },
};
const alertEvent: AlertsEvent = {
  event_id: '9b94f021-0d9a-4999-b86e-6a3c7a917512',
  occurred_at: '2026-11-18T00:00:00Z',
  alert: {
    alert_id: AID,
    finding_id: FID,
    severity: 'low',
    sla_due_at: '2026-11-19T00:00:00Z',
  },
};

describe('IngestService', () => {
  let store: MemoryStore;
  let svc: IngestService;
  beforeEach(() => {
    store = new MemoryStore();
    svc = new IngestService(store);
  });

  it('persists finding then alert; redelivery is a duplicate', async () => {
    expect(await svc.ingestFinding(findingEvent, UTIL)).toBe('created');
    expect(await svc.ingestFinding(findingEvent, UTIL)).toBe('duplicate');
    expect(await svc.ingestAlert(alertEvent, UTIL)).toBe('created');
    expect(await svc.ingestAlert(alertEvent, UTIL)).toBe('duplicate');
    expect((await store.listFindings({ utilityId: UTIL }))[0].id).toBe(FID);
    const alerts = await store.listAlerts({ utilityId: UTIL });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe(AID);
  });

  it('prefers inspection utility over default', async () => {
    await store.createInspection({
      id: findingEvent.inspection_id,
      utility_id: 'other-util',
      status: 'processing',
    } as never);
    await svc.ingestFinding(findingEvent, UTIL);
    expect((await store.getFinding(FID))?.utility_id).toBe('other-util');
  });

  it('persists unknown-inspection finding using event.utility_id (no default)', async () => {
    const ev = { ...findingEvent, utility_id: 'event-util' };
    expect(await svc.ingestFinding(ev, null)).toBe('created');
    expect((await store.getFinding(FID))?.utility_id).toBe('event-util');
  });

  it('event.utility_id beats default; inspection row beats event', async () => {
    await svc.ingestFinding({ ...findingEvent, utility_id: 'event-util' }, UTIL);
    expect((await store.getFinding(FID))?.utility_id).toBe('event-util');
    const s2 = new MemoryStore();
    await s2.createInspection({
      id: findingEvent.inspection_id,
      utility_id: 'insp-util',
      status: 'processing',
    } as never);
    await new IngestService(s2).ingestFinding(
      { ...findingEvent, utility_id: 'event-util' },
      UTIL,
    );
    expect((await s2.getFinding(FID))?.utility_id).toBe('insp-util');
  });

  it('alert inherits finding utility when event omits it', async () => {
    await svc.ingestFinding(findingEvent, UTIL);
    await svc.ingestAlert(alertEvent, null);
    expect((await store.getAlert(AID))?.utility_id).toBe(UTIL);
  });

  it('rejects finding with no resolvable utility', async () => {
    await expect(svc.ingestFinding(findingEvent, null)).rejects.toThrow(
      IngestRejectedError,
    );
  });

  it('rejects bad class_id', async () => {
    const bad = {
      ...findingEvent,
      finding: { ...findingEvent.finding, class_id: 'nope' },
    } as unknown as FindingsEvent;
    await expect(svc.ingestFinding(bad, UTIL)).rejects.toThrow(
      IngestRejectedError,
    );
  });
});

describe('KafkaConsumerService.handle', () => {
  const settings = loadSettings({ PULSE_KAFKA_DEFAULT_UTILITY_ID: UTIL });
  const cfg = settings.kafka!;

  it('routes by topic, skips poison, rethrows store errors', async () => {
    const store = new MemoryStore();
    const svc = new KafkaConsumerService(settings, new IngestService(store));
    await svc.handle(cfg, 'vp.findings.v1', JSON.stringify(findingEvent));
    await svc.handle(cfg, 'vp.alerts.v1', JSON.stringify(alertEvent));
    await svc.handle(cfg, 'vp.findings.v1', '{not json');
    await svc.handle(cfg, 'vp.findings.v1', '{"finding":{}}');
    expect(await store.getAlert(AID)).toBeTruthy();

    jest.spyOn(store, 'getFinding').mockRejectedValueOnce(new Error('db down'));
    await expect(
      svc.handle(cfg, 'vp.findings.v1', JSON.stringify(findingEvent)),
    ).rejects.toThrow('db down');
  });

  it('is disabled by default', () => {
    expect(loadSettings({}).kafka?.enabled).toBe(false);
  });
});
