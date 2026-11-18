import { readFile } from 'node:fs/promises';
import { appendRecords, FileTail } from './bus/file-bus.js';
import { assertDetectShape } from './bus/fixture-source.js';
import { HttpSink, httpSinkEnabled } from './bus/http-sink.js';
import { KafkaSink, kafkaSinkEnabled } from './bus/kafka-sink.js';
import { kafkaSourceEnabled, startKafkaSource } from './bus/kafka-source.js';
import { MemorySink } from './bus/memory-sink.js';
import type { Settings } from './config/settings.js';
import { processDetectEvent } from './rules-engine.js';
import type { AssetContext } from './types.js';

export type LoopStats = {
  inputs: { file: boolean; kafka: boolean };
  outputs: { file: boolean; kafka: boolean; http: boolean };
  detects: number;
  findings: number;
  alerts: number;
  rejected: number;
  /** pulse-api HTTP sink: records accepted / failed (failures never stop the loop). */
  http: { posted: number; failed: number };
};

export type Loop = {
  stats: LoopStats;
  /** Process one raw vp.detect.v1 JSON text. Bad input is logged + counted; emit failures reject (Kafka redelivers). */
  handleRaw(raw: string, label?: string): Promise<void>;
  stop(): Promise<void>;
};

export async function startLoop(settings: Settings): Promise<Loop> {
  const { loop } = settings;
  const assets = loop.assetsFile
    ? (JSON.parse(await readFile(loop.assetsFile, 'utf8')) as Record<string, AssetContext>)
    : undefined;
  const kafkaOut = kafkaSinkEnabled(settings) ? await KafkaSink.connect(settings) : null;
  if (settings.kafkaProducer.enabled && !kafkaOut) {
    console.error('[grid-rules] producer flag on but KAFKA_BROKERS unset — kafka publish skipped');
  }
  const httpOut = httpSinkEnabled(settings) ? new HttpSink(settings) : null;
  const sink = new MemorySink(settings);
  const stats: LoopStats = {
    inputs: { file: false, kafka: false },
    outputs: { file: loop.outDir !== null, kafka: kafkaOut !== null, http: httpOut !== null },
    detects: 0,
    findings: 0,
    alerts: 0,
    rejected: 0,
    http: { posted: 0, failed: 0 },
  };

  // Serialize processing: file poll + kafka consumer share the loop.
  let chain: Promise<void> = Promise.resolve();
  const handleRaw = (raw: string, label = 'detect'): Promise<void> => {
    const run = chain.then(async () => {
      let detect;
      try {
        const parsed: unknown = JSON.parse(raw);
        assertDetectShape(parsed, label);
        detect = parsed;
      } catch (err) {
        stats.rejected++;
        console.error(`[grid-rules] rejected ${label}: ${(err as Error).message}`);
        return;
      }
      const result = processDetectEvent(detect, { settings, assets });
      const emitted = sink.emit(result);
      sink.records.length = 0; // loop is long-running; do not accumulate
      if (loop.outDir) await appendRecords(loop.outDir, emitted);
      if (kafkaOut) await kafkaOut.publish(emitted);
      if (httpOut) {
        const r = await httpOut.post(emitted);
        stats.http.posted += r.posted;
        stats.http.failed += r.failed;
      }
      stats.detects++;
      stats.findings += result.findings.length;
      stats.alerts += result.alerts.length;
    });
    chain = run.catch(() => undefined); // keep the queue alive; caller sees the failure
    return run;
  };

  let timer: NodeJS.Timeout | undefined;
  if (loop.detectFile) {
    const tail = new FileTail(loop.detectFile);
    stats.inputs.file = true;
    let polling = false;
    timer = setInterval(() => {
      if (polling) return;
      polling = true;
      tail
        .poll()
        .then((lines) => Promise.all(lines.map((l) => handleRaw(l, loop.detectFile!))))
        .catch((err: unknown) => {
          console.error(`[grid-rules] file poll failed: ${(err as Error).message}`);
        })
        .finally(() => {
          polling = false;
        });
    }, loop.pollMs);
  }

  const consumer = kafkaSourceEnabled(settings)
    ? await startKafkaSource(settings, (raw) => handleRaw(raw, settings.topics.detect))
    : null;
  stats.inputs.kafka = consumer !== null;
  if (loop.kafkaConsumer.enabled && !consumer) {
    console.error('[grid-rules] consumer flag on but KAFKA_BROKERS unset — kafka consume skipped');
  }

  return {
    stats,
    handleRaw,
    async stop() {
      if (timer) clearInterval(timer);
      await consumer?.disconnect();
      await chain;
      await kafkaOut?.disconnect();
    },
  };
}
