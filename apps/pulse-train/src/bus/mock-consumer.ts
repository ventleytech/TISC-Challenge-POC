import type { DetectionId, LabelerRole, VpLabelsV1 } from '../types.js';

const DETECTIONS = new Set<DetectionId>([
  'crack',
  'sag',
  'corrosion',
  'vegetation',
  'thermal_hotspot',
]);

const ROLES = new Set<LabelerRole>([
  'energy_operator',
  'energy_supervisor',
  'utility_admin',
  'platform_admin',
]);

export class LabelValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LabelValidationError';
  }
}

function asDetection(value: unknown, field: string): DetectionId {
  if (typeof value !== 'string' || !DETECTIONS.has(value as DetectionId)) {
    throw new LabelValidationError(`${field} invalid: ${String(value)}`);
  }
  return value as DetectionId;
}

/** Validate + normalize a vp.labels.v1-shaped payload (mock Kafka consume). */
export function parseVpLabelsV1(raw: unknown): VpLabelsV1 {
  if (!raw || typeof raw !== 'object') {
    throw new LabelValidationError('body must be object');
  }
  const body = raw as Record<string, unknown>;
  if (typeof body.event_id !== 'string' || !body.event_id) {
    throw new LabelValidationError('event_id required');
  }
  if (typeof body.occurred_at !== 'string' || !body.occurred_at) {
    throw new LabelValidationError('occurred_at required');
  }
  if (!body.label || typeof body.label !== 'object') {
    throw new LabelValidationError('label required');
  }
  const label = body.label as Record<string, unknown>;
  for (const key of ['label_id', 'finding_id', 'labeler_role'] as const) {
    if (typeof label[key] !== 'string' || !label[key]) {
      throw new LabelValidationError(`${key} required`);
    }
  }
  if (!ROLES.has(label.labeler_role as LabelerRole)) {
    throw new LabelValidationError(`labeler_role invalid: ${label.labeler_role}`);
  }
  const classId = asDetection(label.class_id, 'class_id');

  let accepted: boolean | undefined;
  if (label.accepted !== undefined) {
    if (typeof label.accepted !== 'boolean') {
      throw new LabelValidationError('accepted must be boolean');
    }
    accepted = label.accepted;
  }

  let corrected: DetectionId | null | undefined;
  if (label.corrected_class_id !== undefined) {
    if (label.corrected_class_id === null) {
      corrected = null;
    } else {
      corrected = asDetection(label.corrected_class_id, 'corrected_class_id');
    }
  }

  return {
    event_id: body.event_id,
    occurred_at: body.occurred_at,
    label: {
      label_id: label.label_id as string,
      finding_id: label.finding_id as string,
      inspection_id:
        typeof label.inspection_id === 'string' ? label.inspection_id : undefined,
      class_id: classId,
      accepted,
      corrected_class_id: corrected,
      labeler_role: label.labeler_role as LabelerRole,
      notes: typeof label.notes === 'string' || label.notes === null ? label.notes : undefined,
    },
  };
}

export interface MockBusState {
  topic: string;
  consumed: VpLabelsV1[];
}

export function createMockBus(topic: string): MockBusState {
  return { topic, consumed: [] };
}

export function consumeLabel(bus: MockBusState, event: VpLabelsV1): VpLabelsV1 {
  bus.consumed.push(event);
  return event;
}
