import * as path from 'node:path';
import { loadSettings, parseStubKeys } from './settings';

describe('loadSettings', () => {
  it('reads PULSE_API_PORT from env', () => {
    const settings = loadSettings({ PULSE_API_PORT: '3010' });
    expect(settings.port).toBe(3010);
  });

  it('defaults port to 3000', () => {
    const settings = loadSettings({});
    expect(settings.port).toBe(3000);
  });

  it('rejects invalid port', () => {
    expect(() => loadSettings({ PULSE_API_PORT: 'nope' })).toThrow(
      /Invalid PULSE_API_PORT/,
    );
  });

  it('resolves OpenAPI under packages/contracts by default', () => {
    const settings = loadSettings({});
    expect(settings.openapiPath).toContain(
      path.join('packages', 'contracts', 'openapi', 'openapi.yaml'),
    );
  });

  it('defaults auth enabled', () => {
    expect(loadSettings({}).authEnabled).toBe(true);
  });

  it('parses PULSE_AUTH_STUB_KEYS', () => {
    const util = '00000000-0000-4000-8000-000000000001';
    const settings = loadSettings({
      PULSE_AUTH_STUB_KEYS: `dev-platform:platform_admin:;dev-op:energy_operator:${util}`,
    });
    expect(settings.authPrincipals.get('dev-platform')?.role).toBe(
      'platform_admin',
    );
    expect(settings.authPrincipals.get('dev-op')?.utilityId).toBe(util);
  });

  it('reads PULSE_DATABASE_URL when set', () => {
    const url = 'postgres://voltpulse:change-me-local-only@127.0.0.1:5432/voltpulse';
    expect(loadSettings({ PULSE_DATABASE_URL: url }).databaseUrl).toBe(url);
    expect(loadSettings({}).databaseUrl).toBeNull();
  });
});

describe('parseStubKeys', () => {
  it('rejects unknown role', () => {
    expect(() => parseStubKeys('x:not_a_role:u')).toThrow(/Unknown Energy role/);
  });

  it('requires utility_id for non-platform roles', () => {
    expect(() => parseStubKeys('x:viewer:')).toThrow(/utility_id required/);
  });
});
