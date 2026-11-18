import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { loadSettings } from './config/settings';
import { mountOpenApi } from './openapi/mount-openapi';

async function bootstrap() {
  const settings = loadSettings();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // base64 crops: allow ~1.4x PULSE_EVIDENCE_MAX_BYTES (express default 100kb).
  app.useBodyParser('json', {
    limit: Math.ceil((settings.evidence?.maxBytes ?? 5 * 1024 * 1024) * 1.4),
  });
  if (settings.corsOrigins?.length) {
    app.enableCors({ origin: settings.corsOrigins });
  }
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  mountOpenApi(app, settings);
  await app.listen(settings.port);
}

bootstrap().catch((err: unknown) => {
  console.error('pulse-api failed to start', err);
  process.exit(1);
});
