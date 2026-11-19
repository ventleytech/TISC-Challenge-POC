import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Consumer, Kafka, Producer, logLevel } from 'kafkajs';
import { PULSE_API_SETTINGS } from '../config/settings.module';
import type { KafkaIngestSettings, PulseApiSettings } from '../config/settings';
import {
  IngestRejectedError,
  IngestService,
  type AlertsEvent,
  type FindingsEvent,
} from './ingest.service';
import {
  fileSink,
  kafkaSink,
  type DeadLetterReason,
  type DeadLetterSink,
} from './dead-letter';

type MessageMeta = { partition?: number; offset?: string };

/**
 * Subscribes to vp.findings.v1 + vp.alerts.v1 and persists via IngestService.
 * Off unless PULSE_KAFKA_CONSUMER_ENABLED=true (HTTP ingest remains the default).
 *
 * Failure policy: malformed / unattributable messages are logged and skipped
 * (offset advances); store/transport errors throw so kafkajs retries.
 * With PULSE_KAFKA_DLQ_ENABLED=true each skipped message is also written to the
 * DLQ (vp.dlq.v1 topic, or JSONL when PULSE_KAFKA_DLQ_FILE is set). A DLQ write
 * failure is logged and does not block the offset (no poison loop).
 */
@Injectable()
export class KafkaConsumerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: Consumer | null = null;
  private dlqProducer: Producer | null = null;
  private dlqSink: DeadLetterSink | null = null;
  private readonly cfg: KafkaIngestSettings | undefined;

  constructor(
    @Inject(PULSE_API_SETTINGS) settings: PulseApiSettings,
    private readonly ingest: IngestService,
  ) {
    this.cfg = settings.kafka;
  }

  async onModuleInit(): Promise<void> {
    const cfg = this.cfg;
    if (!cfg?.enabled || !cfg.bootstrap) {
      this.logger.log('Kafka consumer disabled (PULSE_KAFKA_CONSUMER_ENABLED)');
      return;
    }
    const kafka = new Kafka({
      clientId: cfg.clientId,
      brokers: cfg.bootstrap.split(',').map((b) => b.trim()),
      logLevel: logLevel.WARN,
    });
    if (cfg.dlq.enabled) {
      if (cfg.dlq.file) {
        this.dlqSink = fileSink(cfg.dlq.file);
      } else {
        this.dlqProducer = kafka.producer();
        await this.dlqProducer.connect();
        this.dlqSink = kafkaSink(this.dlqProducer, cfg.dlq.topic);
      }
    }
    this.consumer = kafka.consumer({ groupId: cfg.groupId });
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: [cfg.findingsTopic, cfg.alertsTopic],
      fromBeginning: true,
    });
    // run() resolves once the loop is started; do not await message processing.
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        await this.handle(cfg, topic, message.value?.toString() ?? '', {
          partition,
          offset: message.offset,
        });
      },
    });
    this.logger.log(
      `Kafka consumer up: ${cfg.bootstrap} group=${cfg.groupId} ` +
        `topics=${cfg.findingsTopic},${cfg.alertsTopic}`,
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.consumer?.disconnect();
    await this.dlqProducer?.disconnect();
  }

  /** Test seam: inject a DLQ sink without a broker. */
  setDeadLetterSink(sink: DeadLetterSink | null): void {
    this.dlqSink = sink;
  }

  private async deadLetter(
    reason: DeadLetterReason,
    detail: string,
    topic: string,
    raw: string,
    meta: MessageMeta,
  ): Promise<void> {
    if (!this.dlqSink) return;
    try {
      await this.dlqSink({
        dlq_version: 1,
        reason,
        detail,
        source_topic: topic,
        partition: meta.partition ?? null,
        offset: meta.offset ?? null,
        failed_at: new Date().toISOString(),
        payload: raw,
      });
    } catch (err) {
      this.logger.error(
        `DLQ write failed (${reason} on ${topic}): ${String(err)}`,
      );
    }
  }

  /** Exposed for unit tests (no broker). */
  async handle(
    cfg: KafkaIngestSettings,
    topic: string,
    raw: string,
    meta: MessageMeta = {},
  ): Promise<void> {
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      this.logger.warn(`skip non-JSON message on ${topic}: ${String(err)}`);
      await this.deadLetter('non_json', String(err), topic, raw, meta);
      return;
    }
    try {
      if (topic === cfg.findingsTopic) {
        await this.ingest.ingestFinding(
          payload as FindingsEvent,
          cfg.defaultUtilityId,
        );
      } else if (topic === cfg.alertsTopic) {
        await this.ingest.ingestAlert(
          payload as AlertsEvent,
          cfg.defaultUtilityId,
        );
      } else {
        this.logger.warn(`message on unexpected topic ${topic}`);
        await this.deadLetter('unexpected_topic', topic, topic, raw, meta);
      }
    } catch (err) {
      if (err instanceof IngestRejectedError) {
        this.logger.warn(`skip rejected message on ${topic}: ${err.message}`);
        await this.deadLetter('rejected', err.message, topic, raw, meta);
        return;
      }
      throw err;
    }
  }
}
