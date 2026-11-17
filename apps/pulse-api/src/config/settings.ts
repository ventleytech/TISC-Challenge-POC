import * as path from 'node:path';

export type PulseApiSettings = {
  port: number;
  openapiPath: string;
  openapiUrlPath: string;
  swaggerPath: string;
};

/**
 * Load pulse-api settings from env. Ports/hosts come from .env.template keys
 * (PULSE_API_PORT). OpenAPI defaults to packages/contracts — override via
 * PULSE_OPENAPI_PATH when the process cwd layout differs.
 */
export function loadSettings(
  env: NodeJS.ProcessEnv = process.env,
): PulseApiSettings {
  const portRaw = env.PULSE_API_PORT ?? '3000';
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PULSE_API_PORT: ${portRaw}`);
  }

  const defaultOpenApi = path.resolve(
    __dirname,
    '../../../../packages/contracts/openapi/openapi.yaml',
  );

  return {
    port,
    openapiPath: env.PULSE_OPENAPI_PATH ?? defaultOpenApi,
    openapiUrlPath: '/api/openapi.yaml',
    swaggerPath: '/api/docs',
  };
}
