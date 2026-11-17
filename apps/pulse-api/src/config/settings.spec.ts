import * as path from 'node:path';
import { loadSettings } from './settings';

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
});
