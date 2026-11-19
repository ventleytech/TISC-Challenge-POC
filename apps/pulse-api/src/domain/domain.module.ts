import { Global, Logger, Module } from '@nestjs/common';
import { PULSE_API_SETTINGS } from '../config/settings.module';
import type { PulseApiSettings } from '../config/settings';
import { DomainStore } from './domain.store';
import { MemoryStore } from './memory.store';
import { PostgresStore } from './postgres.store';

const logger = new Logger('DomainModule');

@Global()
@Module({
  providers: [
    {
      provide: DomainStore,
      inject: [PULSE_API_SETTINGS],
      useFactory: async (settings: PulseApiSettings): Promise<DomainStore> => {
        if (settings.databaseUrl) {
          const store = new PostgresStore(settings.databaseUrl);
          await store.ping();
          logger.log('Using PostgresStore (PULSE_DATABASE_URL)');
          return store;
        }
        logger.warn(
          'PULSE_DATABASE_URL unset — using MemoryStore (process-local)',
        );
        return new MemoryStore();
      },
    },
  ],
  exports: [DomainStore],
})
export class DomainModule {}
