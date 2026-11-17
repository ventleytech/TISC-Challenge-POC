import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppendOnlyAuditLog, createAuditEvent } from '../src/index.js';

describe('createAuditEvent', () => {
  it('builds who/when/action/entity fields', () => {
    const e = createAuditEvent({
      actor_id: 'user-1',
      action: 'finding.ack',
      entity_type: 'finding',
      entity_id: 'f-9',
      utility_id: 'util-a',
      occurred_at: '2026-11-18T00:00:00.000Z',
      event_id: 'evt-1',
      detail: { note: 'acked' },
    });
    assert.equal(e.actor_id, 'user-1');
    assert.equal(e.occurred_at, '2026-11-18T00:00:00.000Z');
    assert.equal(e.action, 'finding.ack');
    assert.equal(e.entity_type, 'finding');
    assert.equal(e.entity_id, 'f-9');
    assert.equal(e.utility_id, 'util-a');
    assert.equal(e.event_id, 'evt-1');
    assert.deepEqual(e.detail, { note: 'acked' });
  });

  it('rejects empty actor_id', () => {
    assert.throws(
      () =>
        createAuditEvent({
          actor_id: '  ',
          action: 'x',
          entity_type: 'finding',
          entity_id: '1',
        }),
      /actor_id/,
    );
  });
});

describe('AppendOnlyAuditLog', () => {
  it('appends in order and lists snapshots', () => {
    const log = new AppendOnlyAuditLog();
    log.append({
      actor_id: 'a',
      action: 'alert.create',
      entity_type: 'alert',
      entity_id: '1',
      occurred_at: '2026-11-18T01:00:00.000Z',
    });
    log.append({
      actor_id: 'b',
      action: 'alert.ack',
      entity_type: 'alert',
      entity_id: '1',
      occurred_at: '2026-11-18T02:00:00.000Z',
    });
    assert.equal(log.size, 2);
    const all = log.list();
    assert.equal(all[0]!.action, 'alert.create');
    assert.equal(all[1]!.action, 'alert.ack');
  });

  it('filters by actor / action / entity / utility / time', () => {
    const log = new AppendOnlyAuditLog();
    log.append({
      actor_id: 'op-1',
      action: 'label.create',
      entity_type: 'label',
      entity_id: 'L1',
      utility_id: 'u1',
      occurred_at: '2026-11-18T10:00:00.000Z',
    });
    log.append({
      actor_id: 'op-2',
      action: 'finding.ack',
      entity_type: 'finding',
      entity_id: 'F1',
      utility_id: 'u2',
      occurred_at: '2026-11-18T12:00:00.000Z',
    });
    assert.equal(log.filter({ utility_id: 'u1' }).length, 1);
    assert.equal(log.filter({ action: 'finding.ack' })[0]!.entity_id, 'F1');
    assert.equal(
      log.filter({
        since: '2026-11-18T11:00:00.000Z',
        until: '2026-11-18T13:00:00.000Z',
      }).length,
      1,
    );
  });

  it('rejects update / delete / clear', () => {
    const log = new AppendOnlyAuditLog();
    log.append({
      actor_id: 'a',
      action: 'x',
      entity_type: 'finding',
      entity_id: '1',
    });
    assert.throws(() => log.update('any', { action: 'y' }), /append-only/);
    assert.throws(() => log.delete('any'), /append-only/);
    assert.throws(() => log.clear(), /append-only/);
    assert.equal(log.size, 1);
  });

  it('freezes stored events against mutation', () => {
    const log = new AppendOnlyAuditLog();
    const e = log.append({
      actor_id: 'a',
      action: 'x',
      entity_type: 'finding',
      entity_id: '1',
      detail: { k: 1 },
    });
    assert.throws(() => {
      (e as { action: string }).action = 'mutated';
    }, TypeError);
  });
});
