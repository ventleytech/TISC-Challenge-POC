import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { MemoryStore } from '../domain/memory.store';
import { InspectionsController } from './inspections.controller';
import type { PulseApiSettings } from '../config/settings';

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

describe('InspectionsController', () => {
  let controller: InspectionsController;
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
    controller = new InspectionsController(store, disabledAuth());
  });

  it('creates and lists by utility_id', () => {
    const utilityId = '00000000-0000-4000-8000-000000000001';
    const { id } = controller.create({ utility_id: utilityId });
    expect(id).toBeTruthy();
    const listed = controller.list(utilityId);
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0].status).toBe('planned');
    expect(controller.getOne(id).id).toBe(id);
  });

  it('requires utility_id on list', () => {
    expect(() => controller.list(undefined)).toThrow(BadRequestException);
  });

  it('404s unknown id', () => {
    expect(() =>
      controller.getOne('00000000-0000-4000-8000-000000000099'),
    ).toThrow(NotFoundException);
  });
});
