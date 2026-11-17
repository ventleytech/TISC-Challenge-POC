import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loadSettings } from './config/settings';
import { mountOpenApi } from './openapi/mount-openapi';

async function bootstrap() {
  const settings = loadSettings();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  mountOpenApi(app, settings);
  await app.listen(settings.port);
}

bootstrap().catch((err: unknown) => {
  console.error('pulse-api failed to start', err);
  process.exit(1);
});
