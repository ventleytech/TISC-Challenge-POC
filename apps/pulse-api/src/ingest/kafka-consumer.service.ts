import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Consumer, Kafka, logLevel } from 'kafkajs';
import { PULSE_API_SETTINGS } from '../config/settings.module';
import type { KafkaIngestSettings, PulseApiSettings } from '../config/settings';
import {
  IngestRejectedError,
  IngestService,
  type AlertsEvent,
  type FindingsEvent,
} from './ingest.service';

/**
 * Subscribes to vp.findings.v1 + vp.alerts.v1 and persists via IngestService.
 * Off unless PULSE_KAFKA_CONSUMER_ENABLED=true (HTTP ingest remains the default).
 *
 * Failure policy: malformed / unattributable messages are logged and skipped
 * (offset advances); store/transport errors throw so kafkajs retries.
 */
@Injectable()
export class KafkaConsumerService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: Consumer | null = null;
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
    this.consumer = kafka.consumer({ groupId: cfg.groupId });
    await this.consumer.connect();
    await this.consumer.subscribe({
      topics: [cfg.findingsTopic, cfg.alertsTopic],
      fromBeginning: true,
    });
    // run() resolves once the loop is started; do not await message processing.
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        await this.handle(cfg, topic, message.value?.toString() ?? '');
      },
    });
    this.logger.log(
      `Kafka consumer up: ${cfg.bootstrap} group=${cfg.groupId} ` +
        `topics=${cfg.findingsTopic},${cfg.alertsTopic}`,
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.consumer?.disconnect();
  }

  /** Exposed for unit tests (no broker). */
  async handle(
    cfg: KafkaIngestSettings,
    topic: string,
    raw: string,
  ): Promise<void> {
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      this.logger.warn(`skip non-JSON message on ${topic}: ${String(err)}`);
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
      }
    } catch (err) {
      if (err instanceof IngestRejectedError) {
        this.logger.warn(`skip rejected message on ${topic}: ${err.message}`);
        return;
      }
      throw err;
    }
  }
}
