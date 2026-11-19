/**
 * VoltPulse offline sync protocol types (W07 stub).
 * Envelope name mirrors vp.* event family: vp.offline.sync.v1
 */

/** @typedef {'create' | 'update' | 'delete'} SyncOpKind */
/** @typedef {'inspections' | 'findings' | 'alerts' | 'assets'} SyncResource */

/**
 * @typedef {object} SyncOp
 * @property {string} id
 * @property {SyncOpKind} op
 * @property {SyncResource} resource
 * @property {Record<string, unknown>} payload
 * @property {string} client_ts ISO-8601
 */

/**
 * @typedef {object} SyncEnvelope
 * @property {'vp.offline.sync.v1'} schema
 * @property {number} version
 * @property {string} device_id
 * @property {string} utility_id
 * @property {string} client_cursor opaque client watermark
 * @property {SyncOp[]} ops
 * @property {string} created_at ISO-8601
 */

/**
 * @typedef {object} SyncReject
 * @property {string} id
 * @property {string} reason
 */

/**
 * @typedef {object} SyncAck
 * @property {'vp.offline.sync.ack.v1'} schema
 * @property {string[]} accepted_ids
 * @property {SyncReject[]} rejected
 * @property {string} server_cursor
 * @property {string} ack_at ISO-8601
 */

export const PROTOCOL_SCHEMA = "vp.offline.sync.v1";
export const ACK_SCHEMA = "vp.offline.sync.ack.v1";
export const PROTOCOL_VERSION = 1;

export const SYNC_OP_KINDS = Object.freeze(["create", "update", "delete"]);
export const SYNC_RESOURCES = Object.freeze([
  "inspections",
  "findings",
  "alerts",
  "assets",
]);

/**
 * @param {unknown} value
 * @returns {value is SyncOp}
 */
export function isSyncOp(value) {
  if (!value || typeof value !== "object") return false;
  const op = /** @type {Record<string, unknown>} */ (value);
  return (
    typeof op.id === "string" &&
    op.id.length > 0 &&
    SYNC_OP_KINDS.includes(/** @type {string} */ (op.op)) &&
    SYNC_RESOURCES.includes(/** @type {string} */ (op.resource)) &&
    op.payload !== null &&
    typeof op.payload === "object" &&
    !Array.isArray(op.payload) &&
    typeof op.client_ts === "string" &&
    op.client_ts.length > 0
  );
}

/**
 * @param {Omit<SyncOp, never>} input
 * @returns {SyncOp}
 */
export function buildOp(input) {
  if (!isSyncOp(input)) {
    throw new TypeError("invalid SyncOp");
  }
  return {
    id: input.id,
    op: input.op,
    resource: input.resource,
    payload: { ...input.payload },
    client_ts: input.client_ts,
  };
}

/**
 * @param {{ device_id: string, utility_id: string, ops: SyncOp[], client_cursor?: string, created_at?: string }} input
 * @returns {SyncEnvelope}
 */
export function buildEnvelope(input) {
  const { device_id, utility_id, ops } = input;
  if (!device_id || !utility_id) {
    throw new TypeError("device_id and utility_id required");
  }
  if (!Array.isArray(ops) || !ops.every(isSyncOp)) {
    throw new TypeError("ops must be SyncOp[]");
  }
  return {
    schema: PROTOCOL_SCHEMA,
    version: PROTOCOL_VERSION,
    device_id,
    utility_id,
    client_cursor: input.client_cursor ?? "",
    ops: ops.map((op) => buildOp(op)),
    created_at: input.created_at ?? new Date().toISOString(),
  };
}

/**
 * @param {{ accepted_ids?: string[], rejected?: SyncReject[], server_cursor: string, ack_at?: string }} input
 * @returns {SyncAck}
 */
export function buildAck(input) {
  if (typeof input.server_cursor !== "string") {
    throw new TypeError("server_cursor required");
  }
  const rejected = input.rejected ?? [];
  for (const row of rejected) {
    if (!row || typeof row.id !== "string" || typeof row.reason !== "string") {
      throw new TypeError("rejected entries need id + reason");
    }
  }
  return {
    schema: ACK_SCHEMA,
    accepted_ids: [...(input.accepted_ids ?? [])],
    rejected: rejected.map((r) => ({ id: r.id, reason: r.reason })),
    server_cursor: input.server_cursor,
    ack_at: input.ack_at ?? new Date().toISOString(),
  };
}
