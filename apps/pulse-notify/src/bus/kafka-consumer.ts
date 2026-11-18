import { Kafka, logLevel, type Consumer } from 'kafkajs';
import type { NotifySettings } from '../config.js';
import { processAlertEvent } from '../pipeline.js';
import { AlertValidationError, parseVpAlertsV1, type MockBusState } from './mock-consumer.js';

export function kafkaConsumerActive(settings: NotifySettings): boolean {
  return settings.kafka.enabled && settings.kafka.brokers !== null;
}

/**
 * Handle one raw vp.alerts.v1 message. Malformed payloads are logged + skipped
 * (offset advances). Sink failures are recorded in deliveries, not thrown, so
 * only unexpected errors propagate and trigger kafkajs retry.
 */
export async function handleAlertMessage(
  settings: NotifySettings,
  bus: MockBusState,
  raw: string,
  fetchImpl?: typeof fetch,
): Promise<boolean> {
  let event;
  try {
    event = parseVpAlertsV1(JSON.parse(raw));
  } catch (err) {
    if (err instanceof AlertValidationError || err instanceof SyntaxError) {
      console.warn(`[pulse-notify] kafka skip malformed message: ${err.message}`);
      return false;
    }
    throw err;
  }
  await processAlertEvent(settings, bus, event, fetchImpl);
  return true;
}

export async function startKafkaConsumer(
  settings: NotifySettings,
  bus: MockBusState,
): Promise<Consumer> {
  const cfg = settings.kafka;
  const kafka = new Kafka({
    clientId: cfg.clientId,
    brokers: (cfg.brokers ?? '').split(',').map((b) => b.trim()),
    logLevel: logLevel.WARN,
  });
  const consumer = kafka.consumer({ groupId: cfg.groupId });
  await consumer.connect();
  await consumer.subscribe({ topics: [settings.alertsTopic], fromBeginning: cfg.fromBeginning });
  await consumer.run({
    eachMessage: async ({ message }) => {
      await handleAlertMessage(settings, bus, message.value?.toString() ?? '');
    },
  });
  console.info(
    `[pulse-notify] kafka consumer up brokers=${cfg.brokers} group=${cfg.groupId} topic=${settings.alertsTopic}`,
  );
  return consumer;
}
