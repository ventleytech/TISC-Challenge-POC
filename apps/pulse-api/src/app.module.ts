import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './config/settings.module';
import { DomainModule } from './domain/domain.module';
import { HealthModule } from './health/health.module';
import { InspectionsModule } from './inspections/inspections.module';
import { AssetsModule } from './assets/assets.module';
import { AlertsModule } from './alerts/alerts.module';
import { FindingsModule } from './findings/findings.module';
import { EvidenceModule } from './evidence/evidence.module';
import { IngestModule } from './ingest/ingest.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [
    SettingsModule,
    AuthModule,
    DomainModule,
    HealthModule,
    UtilitiesModule,
    InspectionsModule,
    AssetsModule,
    FindingsModule,
    AlertsModule,
    EvidenceModule,
    IngestModule,
    WorkOrdersModule,
  ],
})
export class AppModule {}
