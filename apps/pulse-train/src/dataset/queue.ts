import fs from 'node:fs';
import path from 'node:path';
import type { DatasetQueueItem, LabelKind, VpLabelsV1 } from '../types.js';

export interface DatasetQueue {
  items: DatasetQueueItem[];
  dataDir: string;
  filePath: string;
}

export function createDatasetQueue(dataDir: string): DatasetQueue {
  const filePath = path.join(dataDir, 'dataset-queue.json');
  const queue: DatasetQueue = { items: [], dataDir, filePath };
  loadFromDisk(queue);
  return queue;
}

function loadFromDisk(queue: DatasetQueue): void {
  try {
    if (!fs.existsSync(queue.filePath)) return;
    const raw = fs.readFileSync(queue.filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;
    queue.items = parsed as DatasetQueueItem[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[pulse-train] dataset load failed: ${message}`);
  }
}

function persist(queue: DatasetQueue): void {
  try {
    fs.mkdirSync(queue.dataDir, { recursive: true });
    fs.writeFileSync(queue.filePath, JSON.stringify(queue.items, null, 2), 'utf8');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[pulse-train] dataset persist failed: ${message}`);
  }
}

/** Map accepted flag to TP/FP. Missing accepted defaults to FP (needs review). */
export function labelKind(event: VpLabelsV1): LabelKind {
  return event.label.accepted === true ? 'tp' : 'fp';
}

export function enqueueLabel(queue: DatasetQueue, event: VpLabelsV1): DatasetQueueItem {
  const item: DatasetQueueItem = {
    label_id: event.label.label_id,
    finding_id: event.label.finding_id,
    class_id: event.label.class_id,
    kind: labelKind(event),
    corrected_class_id: event.label.corrected_class_id,
    occurred_at: event.occurred_at,
    event_id: event.event_id,
    queued_at: new Date().toISOString(),
  };
  queue.items.push(item);
  persist(queue);
  return item;
}

export function listQueue(queue: DatasetQueue): DatasetQueueItem[] {
  return [...queue.items];
}
