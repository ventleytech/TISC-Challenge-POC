import { Kafka, logLevel, type Consumer } from 'kafkajs';
import type { Settings } from '../config/settings.js';

/** True only when flag is on AND brokers are configured. */
export function kafkaSourceEnabled(settings: Settings): boolean {
  return settings.loop.kafkaConsumer.enabled && settings.kafkaBrokers !== null;
}

/** Subscribe to the detect topic; each message value is handed to `onMessage` as raw JSON text. */
export async function startKafkaSource(
  settings: Settings,
  onMessage: (raw: string) => Promise<void>,
): Promise<Consumer> {
  if (!kafkaSourceEnabled(settings)) {
    throw new Error('Kafka consumer not enabled (flag or KAFKA_BROKERS missing)');
  }
  const kafka = new Kafka({
    clientId: `${settings.kafkaProducer.clientId}-consumer`,
    brokers: settings.kafkaBrokers!.split(',').map((b) => b.trim()),
    logLevel: logLevel.WARN,
  });
  const consumer = kafka.consumer({ groupId: settings.loop.kafkaConsumer.groupId });
  await consumer.connect();
  await consumer.subscribe({
    topic: settings.topics.detect,
    fromBeginning: settings.loop.kafkaConsumer.fromBeginning,
  });
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (message.value) await onMessage(message.value.toString('utf8'));
    },
  });
  return consumer;
}
