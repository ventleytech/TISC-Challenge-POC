import { Module } from '@nestjs/common';
import { SettingsModule } from './config/settings.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [SettingsModule, HealthModule],
})
export class AppModule {}
