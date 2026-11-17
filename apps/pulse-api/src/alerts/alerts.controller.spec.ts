import { NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import type { PulseApiSettings } from '../config/settings';
import { MemoryStore } from '../domain/memory.store';
import { AlertsController } from './alerts.controller';

function disabledAuth(): AuthService {
  const settings: PulseApiSettings = {
    port: 3000,
    openapiPath: '/tmp/x',
    openapiUrlPath: '/api/openapi.yaml',
    swaggerPath: '/api/docs',
    authEnabled: false,
    authPrincipals: new Map(),
  };
  return new AuthService(settings);
}

describe('AlertsController', () => {
  let controller: AlertsController;
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
    controller = new AlertsController(store, disabledAuth());
  });

  it('acks alert and is idempotent', () => {
    const utilityId = 'util-demo-01';
    const { id } = controller.create({
      utility_id: utilityId,
      finding_id: 'find-1',
      severity: 'high',
    });
    const first = controller.ack(id);
    expect(first.ack_at).toBeTruthy();
    const second = controller.ack(id);
    expect(second.ack_at).toBe(first.ack_at);
    expect(controller.list(utilityId).items[0].ack_at).toBe(first.ack_at);
  });

  it('404s unknown ack id', () => {
    expect(() => controller.ack('missing-alert')).toThrow(NotFoundException);
  });
});
