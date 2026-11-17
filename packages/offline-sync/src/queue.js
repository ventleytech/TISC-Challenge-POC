import { isSyncOp } from "./protocol.js";

/**
 * In-memory FIFO queue for offline SyncOp rows (W07 stub).
 * Durable store / conflict merge come later.
 */
export class InMemoryOpQueue {
  constructor() {
    /** @type {import('./protocol.js').SyncOp[]} */
    this._ops = [];
  }

  /** @returns {number} */
  size() {
    return this._ops.length;
  }

  /**
   * @param {import('./protocol.js').SyncOp} op
   * @returns {number} new size
   */
  enqueue(op) {
    if (!isSyncOp(op)) {
      throw new TypeError("enqueue requires SyncOp");
    }
    if (this._ops.some((existing) => existing.id === op.id)) {
      throw new Error(`duplicate op id: ${op.id}`);
    }
    this._ops.push({
      id: op.id,
      op: op.op,
      resource: op.resource,
      payload: { ...op.payload },
      client_ts: op.client_ts,
    });
    return this._ops.length;
  }

  /** @returns {import('./protocol.js').SyncOp | undefined} */
  peek() {
    return this._ops[0] ? { ...this._ops[0], payload: { ...this._ops[0].payload } } : undefined;
  }

  /** @returns {import('./protocol.js').SyncOp | undefined} */
  dequeue() {
    const next = this._ops.shift();
    return next
      ? { ...next, payload: { ...next.payload } }
      : undefined;
  }

  /**
   * Drain all ops (typical: build envelope then clear).
   * @returns {import('./protocol.js').SyncOp[]}
   */
  drain() {
    const batch = this._ops.map((op) => ({
      ...op,
      payload: { ...op.payload },
    }));
    this._ops = [];
    return batch;
  }

  /** @returns {import('./protocol.js').SyncOp[]} */
  list() {
    return this._ops.map((op) => ({
      ...op,
      payload: { ...op.payload },
    }));
  }

  clear() {
    this._ops = [];
  }
}
