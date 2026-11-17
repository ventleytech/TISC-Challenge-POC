import { Kafka, logLevel } from 'kafkajs';
import type { Settings } from '../config/settings.js';
import type { EmittedRecord } from './memory-sink.js';

/** Minimal producer surface (kafkajs Producer satisfies it); lets tests inject a fake. */
export type ProducerLike = {
  send(args: {
    topic: string;
    messages: Array<{ key: string; value: string }>;
  }): Promise<unknown>;
  disconnect(): Promise<void>;
};

/** True only when flag is on AND brokers are configured. */
export function kafkaSinkEnabled(settings: Settings): boolean {
  return settings.kafkaProducer.enabled && settings.kafkaBrokers !== null;
}

/** Partition key: keep one inspection's events ordered; fall back to finding id. */
export function recordKey(rec: EmittedRecord): string {
  const p = rec.payload;
  if ('finding' in p) return p.inspection_id;
  return p.alert.inspection_id ?? p.alert.finding_id;
}

export class KafkaSink {
  constructor(private readonly producer: ProducerLike) {}

  static async connect(settings: Settings): Promise<KafkaSink> {
    if (!kafkaSinkEnabled(settings)) {
      throw new Error('Kafka producer not enabled (flag or KAFKA_BROKERS missing)');
    }
    const kafka = new Kafka({
      clientId: settings.kafkaProducer.clientId,
      brokers: settings.kafkaBrokers!.split(',').map((b) => b.trim()),
      logLevel: logLevel.WARN,
    });
    const producer = kafka.producer();
    await producer.connect();
    return new KafkaSink(producer);
  }

  /** Publish records grouped per topic (findings first, as emitted). Returns count sent. */
  async publish(records: EmittedRecord[]): Promise<number> {
    const byTopic = new Map<string, Array<{ key: string; value: string }>>();
    for (const rec of records) {
      const msgs = byTopic.get(rec.topic) ?? [];
      msgs.push({ key: recordKey(rec), value: JSON.stringify(rec.payload) });
      byTopic.set(rec.topic, msgs);
    }
    let sent = 0;
    for (const [topic, messages] of byTopic) {
      await this.producer.send({ topic, messages });
      sent += messages.length;
    }
    return sent;
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }
}
