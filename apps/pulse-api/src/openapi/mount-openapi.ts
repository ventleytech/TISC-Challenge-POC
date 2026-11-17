import { INestApplication } from '@nestjs/common';
import { readFileSync, existsSync } from 'node:fs';
import type { Request, Response, Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { load as loadYaml } from 'js-yaml';
import type { PulseApiSettings } from '../config/settings';

/**
 * Mount VoltPulse contract OpenAPI (packages/contracts) + Swagger UI.
 * Does not invent paths — serves the contract document as-is.
 */
export function mountOpenApi(
  app: INestApplication,
  settings: PulseApiSettings,
): void {
  if (!existsSync(settings.openapiPath)) {
    throw new Error(
      `VoltPulse OpenAPI not found at ${settings.openapiPath}. ` +
        'Ensure packages/contracts is present (P0-T002) or set PULSE_OPENAPI_PATH.',
    );
  }

  const raw = readFileSync(settings.openapiPath, 'utf8');
  const document = loadYaml(raw) as Record<string, unknown>;

  const http = app.getHttpAdapter().getInstance() as Express;

  http.get(settings.openapiUrlPath, (_req: Request, res: Response) => {
    res.type('application/yaml').send(raw);
  });

  http.use(
    settings.swaggerPath,
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: 'VoltPulse API',
      swaggerOptions: {
        url: settings.openapiUrlPath,
      },
    }),
  );
}
