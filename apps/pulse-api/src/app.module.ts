import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './config/settings.module';
import { DomainModule } from './domain/domain.module';
import { HealthModule } from './health/health.module';
import { InspectionsModule } from './inspections/inspections.module';
import { AssetsModule } from './assets/assets.module';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [
    SettingsModule,
    AuthModule,
    DomainModule,
    HealthModule,
    InspectionsModule,
    AssetsModule,
    AlertsModule,
  ],
})
export class AppModule {}
