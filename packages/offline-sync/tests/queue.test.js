import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  InMemoryOpQueue,
  buildEnvelope,
} from "../src/index.js";

function op(id, resource = "alerts") {
  return {
    id,
    op: "update",
    resource,
    payload: { id },
    client_ts: "2026-11-18T00:00:00.000Z",
  };
}

describe("InMemoryOpQueue", () => {
  it("enqueues and dequeues FIFO", () => {
    const q = new InMemoryOpQueue();
    assert.equal(q.size(), 0);
    q.enqueue(op("a"));
    q.enqueue(op("b"));
    assert.equal(q.size(), 2);
    assert.equal(q.peek()?.id, "a");
    assert.equal(q.dequeue()?.id, "a");
    assert.equal(q.dequeue()?.id, "b");
    assert.equal(q.dequeue(), undefined);
  });

  it("rejects duplicate ids and invalid ops", () => {
    const q = new InMemoryOpQueue();
    q.enqueue(op("a"));
    assert.throws(() => q.enqueue(op("a")), /duplicate/);
    assert.throws(() => q.enqueue({ id: "x" }), /SyncOp/);
  });

  it("drains into sync envelope", () => {
    const q = new InMemoryOpQueue();
    q.enqueue(op("a", "inspections"));
    q.enqueue(op("b", "assets"));
    const ops = q.drain();
    assert.equal(q.size(), 0);
    const envelope = buildEnvelope({
      device_id: "edge-corridor-1",
      utility_id: "utility-demo",
      ops,
    });
    assert.equal(envelope.ops.length, 2);
    assert.equal(envelope.schema, "vp.offline.sync.v1");
  });

  it("clear empties queue", () => {
    const q = new InMemoryOpQueue();
    q.enqueue(op("a"));
    q.clear();
    assert.equal(q.size(), 0);
    assert.deepEqual(q.list(), []);
  });
});
