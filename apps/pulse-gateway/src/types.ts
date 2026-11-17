export type StreamProtocol = 'rtsp' | 'rtmp';

export type SessionStatus = 'registered' | 'active' | 'stopped';

export interface GatewaySession {
  id: string;
  name: string;
  protocol: StreamProtocol;
  path: string;
  pullUrl: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterSessionInput {
  name: string;
  protocol: StreamProtocol;
  /** Stream path under the gateway (e.g. live/feeder-1). Ignored when url is set. */
  path?: string;
  /** Optional external pull URL; when omitted, built from env public host + ports. */
  url?: string;
}

/** Handoff document for grid-perception live pull (C01 scaffold). */
export interface PerceptionHandoff {
  service: 'pulse-gateway';
  target: 'grid-perception';
  sessionId: string;
  name: string;
  protocol: StreamProtocol;
  pullUrl: string;
  path: string;
  status: SessionStatus;
  registeredAt: string;
  notes: string;
}
