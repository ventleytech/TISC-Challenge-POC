import { consumeLabel, type MockBusState } from './bus/mock-consumer.js';
import type { TrainSettings } from './config.js';
import { enqueueLabel, type DatasetQueue } from './dataset/queue.js';
import type { DatasetQueueItem, VpLabelsV1 } from './types.js';

export interface LabelIngestResult {
  event: VpLabelsV1;
  queueItem: DatasetQueueItem;
}

export function processLabelEvent(
  _settings: TrainSettings,
  bus: MockBusState,
  queue: DatasetQueue,
  event: VpLabelsV1,
): LabelIngestResult {
  consumeLabel(bus, event);
  const queueItem = enqueueLabel(queue, event);
  console.info(
    `[pulse-train] label ingested id=${event.label.label_id} kind=${queueItem.kind} class=${queueItem.class_id}`,
  );
  return { event, queueItem };
}
