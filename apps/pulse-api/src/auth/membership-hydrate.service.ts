import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DomainStore } from '../domain/domain.store';
import { AuthService } from './auth.service';

/**
 * Reload durable utility_admin stub keys into AuthService after restart (T402).
 */
@Injectable()
export class MembershipHydrateService implements OnModuleInit {
  private readonly logger = new Logger(MembershipHydrateService.name);

  constructor(
    private readonly store: DomainStore,
    private readonly auth: AuthService,
  ) {}

  async onModuleInit(): Promise<void> {
    const rows = await this.store.listMemberships();
    for (const row of rows) {
      this.auth.upsertPrincipal(row.key_id, {
        keyId: row.key_id,
        role: row.role,
        utilityId: row.utility_id,
      });
    }
    if (rows.length > 0) {
      this.logger.log(`Hydrated ${rows.length} membership principal(s)`);
    }
  }
}
