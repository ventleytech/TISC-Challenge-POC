import { NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuditService } from '../audit/audit.service';
import type { PulseApiSettings } from '../config/settings';
import { MemoryStore } from '../domain/memory.store';
import { AlertsController } from './alerts.controller';

function disabledAuth(): AuthService {
  const settings: PulseApiSettings = {
    port: 3000,
    databaseUrl: null,
    openapiPath: '/tmp/x',
    openapiUrlPath: '/api/openapi.yaml',
    swaggerPath: '/api/docs',
    authEnabled: false,
    authPrincipals: new Map(),
  };
  return new AuthService(settings);
}

function stubAudit(): AuditService {
  return { append: async () => undefined } as AuditService;
}

describe('AlertsController', () => {
  let controller: AlertsController;
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
    controller = new AlertsController(store, disabledAuth(), stubAudit());
  });

  it('acks alert and is idempotent', async () => {
    const utilityId = 'util-demo-01';
    const { id } = await controller.create({
      utility_id: utilityId,
      finding_id: 'find-1',
      severity: 'high',
    });
    const first = await controller.ack(id);
    expect(first.ack_at).toBeTruthy();
    const second = await controller.ack(id);
    expect(second.ack_at).toBe(first.ack_at);
    expect((await controller.list(utilityId)).items[0].ack_at).toBe(first.ack_at);
  });

  it('404s unknown ack id', async () => {
    await expect(controller.ack('missing-alert')).rejects.toThrow(
      NotFoundException,
    );
  });
});
