import type { Settings } from '../config/settings.js';
import type { RulesEmit, VpAlertsV1, VpFindingsV1 } from '../types.js';

export type EmittedRecord = {
  topic: string;
  payload: VpFindingsV1 | VpAlertsV1;
};

/** In-memory / stdout mock bus — Kafka later without changing engine. */
export class MemorySink {
  readonly records: EmittedRecord[] = [];

  constructor(private readonly settings: Settings) {}

  emit(result: RulesEmit): EmittedRecord[] {
    const out: EmittedRecord[] = [];
    for (const f of result.findings) {
      const rec = { topic: this.settings.topics.findings, payload: f };
      this.records.push(rec);
      out.push(rec);
    }
    for (const a of result.alerts) {
      const rec = { topic: this.settings.topics.alerts, payload: a };
      this.records.push(rec);
      out.push(rec);
    }
    return out;
  }
}
