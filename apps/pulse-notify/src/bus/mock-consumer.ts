import type { VpAlertsV1 } from '../types.js';

const SEVERITIES = new Set(['critical', 'high', 'medium', 'low', 'info']);
const CHANNELS = new Set(['push', 'sms', 'email']);

export class AlertValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlertValidationError';
  }
}

/** Validate + normalize a vp.alerts.v1-shaped payload (mock Kafka consume). */
export function parseVpAlertsV1(raw: unknown): VpAlertsV1 {
  if (!raw || typeof raw !== 'object') {
    throw new AlertValidationError('body must be object');
  }
  const body = raw as Record<string, unknown>;
  if (typeof body.event_id !== 'string' || !body.event_id) {
    throw new AlertValidationError('event_id required');
  }
  if (typeof body.occurred_at !== 'string' || !body.occurred_at) {
    throw new AlertValidationError('occurred_at required');
  }
  if (!body.alert || typeof body.alert !== 'object') {
    throw new AlertValidationError('alert required');
  }
  const alert = body.alert as Record<string, unknown>;
  for (const key of ['alert_id', 'finding_id', 'severity', 'sla_due_at'] as const) {
    if (typeof alert[key] !== 'string' || !alert[key]) {
      throw new AlertValidationError(`${key} required`);
    }
  }
  if (!SEVERITIES.has(alert.severity as string)) {
    throw new AlertValidationError(`severity invalid: ${alert.severity}`);
  }

  let channels: VpAlertsV1['alert']['channels'];
  if (alert.channels !== undefined) {
    if (!Array.isArray(alert.channels)) {
      throw new AlertValidationError('channels must be array');
    }
    for (const c of alert.channels) {
      if (typeof c !== 'string' || !CHANNELS.has(c)) {
        throw new AlertValidationError(`channel invalid: ${String(c)}`);
      }
    }
    channels = alert.channels as VpAlertsV1['alert']['channels'];
  }

  return {
    event_id: body.event_id,
    occurred_at: body.occurred_at,
    alert: {
      alert_id: alert.alert_id as string,
      finding_id: alert.finding_id as string,
      inspection_id: typeof alert.inspection_id === 'string' ? alert.inspection_id : undefined,
      utility_id: typeof alert.utility_id === 'string' ? alert.utility_id : undefined,
      severity: alert.severity as VpAlertsV1['alert']['severity'],
      sla_due_at: alert.sla_due_at as string,
      channels,
    },
  };
}

export interface MockBusState {
  topic: string;
  consumed: VpAlertsV1[];
}

export function createMockBus(topic: string): MockBusState {
  return { topic, consumed: [] };
}

export function consumeAlert(bus: MockBusState, event: VpAlertsV1): VpAlertsV1 {
  bus.consumed.push(event);
  return event;
}
