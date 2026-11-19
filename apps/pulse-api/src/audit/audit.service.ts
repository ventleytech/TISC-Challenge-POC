import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { PULSE_API_SETTINGS } from '../config/settings.module';
import type { PulseApiSettings } from '../config/settings';

export type AuditRecord = {
  at: string;
  action: string;
  actor?: string;
  utility_id?: string;
  resource_id?: string;
  detail?: Record<string, unknown>;
};

@Injectable()
export class AuditService implements OnModuleInit {
  private readonly logger = new Logger(AuditService.name);
  private filePath: string;

  constructor(
    @Inject(PULSE_API_SETTINGS) settings: PulseApiSettings & { auditLogPath?: string },
  ) {
    this.filePath =
      process.env.PULSE_AUDIT_LOG_PATH?.trim() ||
      path.join(process.cwd(), 'data', 'audit.jsonl');
  }

  async onModuleInit(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    this.logger.log(`Audit log → ${this.filePath}`);
  }

  async append(record: Omit<AuditRecord, 'at'> & { at?: string }): Promise<void> {
    const row: AuditRecord = {
      at: record.at ?? new Date().toISOString(),
      action: record.action,
      actor: record.actor,
      utility_id: record.utility_id,
      resource_id: record.resource_id,
      detail: record.detail,
    };
    await appendFile(this.filePath, `${JSON.stringify(row)}\n`, 'utf8');
  }
}
