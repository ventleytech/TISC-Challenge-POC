import type { GatewaySession, PerceptionHandoff } from './types.js';

const HANDOFF_NOTES =
  'C01 hold: record-upload is primary for grid-perception. Optional HLS sim from sample MP4 (infra/media/hls-hold). True RTSP/MediaMTX camera path deferred — see docs/c01-ingest-hold.md.';

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
