import { ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { PulseApiSettings } from '../config/settings';
import type { AuthPrincipal } from './principal';

function serviceWith(
  principals: Map<string, AuthPrincipal>,
  authEnabled = true,
): AuthService {
  const settings: PulseApiSettings = {
    port: 3000,
    openapiPath: '/tmp/openapi.yaml',
    openapiUrlPath: '/api/openapi.yaml',
    swaggerPath: '/api/docs',
    authEnabled,
    authPrincipals: principals,
  };
  return new AuthService(settings);
}

describe('AuthService', () => {
  const utilA = '00000000-0000-4000-8000-000000000001';
  const utilB = '00000000-0000-4000-8000-000000000002';

  it('resolves stub credentials', () => {
    const principal: AuthPrincipal = {
      keyId: 'dev-op',
      role: 'energy_operator',
      utilityId: utilA,
    };
    const auth = serviceWith(new Map([['dev-op', principal]]));
    expect(auth.resolveCredential('dev-op')).toEqual(principal);
    expect(auth.resolveCredential('nope')).toBeNull();
  });

  it('platform_admin crosses utilities', () => {
    const auth = serviceWith(new Map());
    const admin: AuthPrincipal = {
      keyId: 'dev-platform',
      role: 'platform_admin',
      utilityId: null,
    };
    expect(() => auth.assertUtilityAccess(admin, utilB)).not.toThrow();
  });

  it('operator blocked on foreign utility', () => {
    const auth = serviceWith(new Map());
    const op: AuthPrincipal = {
      keyId: 'dev-op',
      role: 'energy_operator',
      utilityId: utilA,
    };
    expect(() => auth.assertUtilityAccess(op, utilB)).toThrow(
      ForbiddenException,
    );
  });
});
