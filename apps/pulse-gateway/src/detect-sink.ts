import { randomUUID } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Kafka, logLevel } from 'kafkajs';
import type { DetectSettings } from './config.js';

export interface DetectEventV1 {
  event_id: string;
  occurred_at: string;
  inspection_id: string;
  asset_id: string | null;
  source: 'live';
  detections: Array<{
    detection_id: string;
    class_id: string;
    confidence: number;
    bbox?: number[];
    reason?: string;
  }>;
}

/** Where gateway publishes synthetic vp.detect.v1 events (Sense plane demo). */
export interface DetectSink {
  readonly mode: 'file' | 'kafka';
  publish(event: DetectEventV1): Promise<void>;
  close(): Promise<void>;
}

/** Minimal producer surface (kafkajs Producer satisfies it); tests inject a fake. */
export type ProducerLike = {
  send(args: { topic: string; messages: Array<{ key: string; value: string }> }): Promise<unknown>;
  disconnect(): Promise<void>;
};

export class FileDetectSink implements DetectSink {
  readonly mode = 'file' as const;
  constructor(private readonly filePath: string) {}

  async publish(event: DetectEventV1): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, `${JSON.stringify(event)}\n`, 'utf8');
  }

  async close(): Promise<void> {}
}

export class KafkaDetectSink implements DetectSink {
  readonly mode = 'kafka' as const;
  constructor(
    private readonly producer: ProducerLike,
    private readonly topic: string,
  ) {}

  async publish(event: DetectEventV1): Promise<void> {
    await this.producer.send({
      topic: this.topic,
      messages: [{ key: event.inspection_id, value: JSON.stringify(event) }],
    });
  }

  async close(): Promise<void> {
    await this.producer.disconnect();
  }
}

/** Null when mode=off. Kafka connects eagerly so bad brokers fail at boot, not first POST. */
export async function createDetectSink(cfg: DetectSettings): Promise<DetectSink | null> {
  if (cfg.mode === 'off') return null;
  if (cfg.mode === 'file') return new FileDetectSink(cfg.filePath);
  const kafka = new Kafka({
    clientId: cfg.clientId,
    brokers: cfg.brokers!.split(',').map((b) => b.trim()),
    logLevel: logLevel.WARN,
  });
  const producer = kafka.producer();
  await producer.connect();
  return new KafkaDetectSink(producer, cfg.topic);
}

export interface SyntheticFrameInput {
  inspection_id?: string;
  asset_id?: string | null;
  class_id?: string;
  confidence?: number;
  bbox?: number[];
}

const CLASS_IDS = new Set(['crack', 'sag', 'corrosion', 'vegetation', 'thermal_hotspot']);

export class FrameValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FrameValidationError';
  }
}

/** Build a contract-shaped vp.detect.v1 event. No inference runs — reason says so. */
export function buildSyntheticDetect(input: SyntheticFrameInput, sessionName: string): DetectEventV1 {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const [k, v] of [['inspection_id', input.inspection_id], ['asset_id', input.asset_id]] as const) {
    if (v !== undefined && v !== null && !uuidRe.test(String(v))) {
      throw new FrameValidationError(`${k} must be a uuid`);
    }
  }
  const classId = input.class_id ?? 'vegetation';
  if (!CLASS_IDS.has(classId)) {
    throw new FrameValidationError(`class_id must be one of ${[...CLASS_IDS].join('|')}`);
  }
  const confidence = input.confidence ?? 0.5;
  if (typeof confidence !== 'number' || !(confidence >= 0 && confidence <= 1)) {
    throw new FrameValidationError('confidence must be a number in [0,1]');
  }
  if (input.bbox !== undefined) {
    if (!Array.isArray(input.bbox) || input.bbox.length !== 4 || input.bbox.some((n) => typeof n !== 'number')) {
      throw new FrameValidationError('bbox must be 4 numbers (xyxy)');
    }
  }
  return {
    event_id: randomUUID(),
    occurred_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    inspection_id: input.inspection_id ?? randomUUID(),
    asset_id: input.asset_id ?? null,
    source: 'live',
    detections: [
      {
        detection_id: randomUUID(),
        class_id: classId,
        confidence,
        ...(input.bbox ? { bbox: input.bbox } : {}),
        reason: `synthetic gateway frame for session ${sessionName}; no inference run`,
      },
    ],
  };
}
