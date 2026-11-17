/** VoltPulse audit action — dotted verb, e.g. `finding.ack`. */
export type AuditAction = string;

export type AuditEntityType =
  | 'finding'
  | 'alert'
  | 'inspection'
  | 'asset'
  | 'label'
  | 'user'
  | 'policy'
  | 'model'
  | string;

export type AuditEvent = {
  /** Stable id; set at append time. */
  event_id: string;
  /** Who performed the action (user / service principal). */
  actor_id: string;
  /** When — ISO-8601 UTC. */
  occurred_at: string;
  /** What happened. */
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  /** Optional multi-utility scope. */
  utility_id?: string;
  /** Optional structured context (immutable after append). */
  detail?: Record<string, unknown>;
};

export type AuditEventInput = {
  actor_id: string;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string;
  utility_id?: string;
  detail?: Record<string, unknown>;
  /** Override clock (tests); otherwise UTC now. */
  occurred_at?: string;
  /** Override id (tests); otherwise random UUID. */
  event_id?: string;
};

export type AuditFilter = {
  actor_id?: string;
  action?: AuditAction;
  entity_type?: AuditEntityType;
  entity_id?: string;
  utility_id?: string;
  /** Inclusive lower bound on occurred_at (ISO string compare). */
  since?: string;
  /** Inclusive upper bound on occurred_at. */
  until?: string;
};
