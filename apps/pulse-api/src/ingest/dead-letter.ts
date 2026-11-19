import { appendFile } from 'node:fs/promises';
import type { Producer } from 'kafkajs';

/** Why an ingest message was skipped (offset still advances). */
export type DeadLetterReason = 'non_json' | 'rejected' | 'unexpected_topic';

/** vp.dlq.v1 envelope (JSON). `payload` is the raw message text, verbatim. */
export type DeadLetterRecord = {
  dlq_version: 1;
  reason: DeadLetterReason;
  detail: string;
  source_topic: string;
  partition: number | null;
  offset: string | null;
  failed_at: string;
  payload: string;
};

export type DeadLetterSink = (rec: DeadLetterRecord) => Promise<void>;

export function fileSink(path: string): DeadLetterSink {
  return (rec) => appendFile(path, JSON.stringify(rec) + '\n', 'utf8');
}

export function kafkaSink(
  producer: Pick<Producer, 'send'>,
  topic: string,
): DeadLetterSink {
  return async (rec) => {
    await producer.send({
      topic,
      messages: [{ key: rec.source_topic, value: JSON.stringify(rec) }],
    });
  };
}
