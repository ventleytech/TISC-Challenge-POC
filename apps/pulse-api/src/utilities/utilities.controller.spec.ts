import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import type { PulseApiSettings } from '../config/settings';
import { MemoryStore } from '../domain/memory.store';
import type { AuthPrincipal } from '../auth/principal';
import { UtilitiesController } from './utilities.controller';

function build() {
  const store = new MemoryStore();
  const settings: PulseApiSettings = {
    port: 3000,
    openapiPath: '/tmp/openapi.yaml',
    openapiUrlPath: '/api/openapi.yaml',
    swaggerPath: '/api/docs',
    authEnabled: true,
    authPrincipals: new Map(),
    databaseUrl: null,
  };
  const auth = new AuthService(settings);
  const controller = new UtilitiesController(store, auth);
  return { store, auth, controller };
}

describe('UtilitiesController', () => {
  it('creates utility + utility_admin stub key', () => {
    const { controller, auth, store } = build();
    const created = controller.create({
      name: 'Acme Grid',
      admin_api_key: 'ua-acme',
    });
    expect(created.id).toBeTruthy();
    expect(created.admin).toEqual({
      api_key: 'ua-acme',
      role: 'utility_admin',
    });
    expect(store.utilities.get(created.id)?.name).toBe('Acme Grid');
    expect(auth.resolveCredential('ua-acme')).toMatchObject({
      role: 'utility_admin',
      utilityId: created.id,
    });
  });

  it('seeds sites and assets for utility', async () => {
    const { controller, store } = build();
    const { id } = controller.create({ name: 'Beta Power' });
    const admin: AuthPrincipal = {
      keyId: 'x',
      role: 'utility_admin',
      utilityId: id,
    };
    const seeded = await controller.seed(
      id,
      {
        sites: [{ name: 'Substation North' }],
        assets: [{ name: 'Tower-1', criticality: 'high' }],
      },
      admin,
    );
    expect(seeded.site_ids).toHaveLength(1);
    expect(seeded.asset_ids).toHaveLength(1);
    expect(store.sites.get(seeded.site_ids[0])?.utility_id).toBe(id);
    expect((await store.getAsset(seeded.asset_ids[0]))?.name).toBe('Tower-1');
  });

  it('rejects empty seed and foreign utility seed', async () => {
    const { controller } = build();
    const { id } = controller.create({ name: 'Gamma' });
    const foreign: AuthPrincipal = {
      keyId: 'other',
      role: 'utility_admin',
      utilityId: '00000000-0000-4000-8000-000000000099',
    };
    await expect(controller.seed(id, {}, foreign)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    const owner: AuthPrincipal = {
      keyId: 'own',
      role: 'utility_admin',
      utilityId: id,
    };
    await expect(
      controller.seed(id, { sites: [] }, owner),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
