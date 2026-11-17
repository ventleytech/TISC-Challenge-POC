import type { GatewaySession, PerceptionHandoff } from './types.js';

const HANDOFF_NOTES =
  'C01 scaffold: grid-perception should pull this URL on the shared inference path. Real MediaMTX + DeepStream wiring is a later card.';

/** Build handoff note for grid-perception from a registered session. */
export function buildPerceptionHandoff(session: GatewaySession): PerceptionHandoff {
  return {
    service: 'pulse-gateway',
    target: 'grid-perception',
    sessionId: session.id,
    name: session.name,
    protocol: session.protocol,
    pullUrl: session.pullUrl,
    path: session.path,
    status: session.status,
    registeredAt: session.createdAt,
    notes: HANDOFF_NOTES,
  };
}
