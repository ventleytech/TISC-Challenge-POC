import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthPrincipal } from '../auth/principal';
import { Roles } from '../auth/roles.decorator';
import { WRITE_ROLES } from '../auth/roles';
import { DomainStore } from '../domain/domain.store';
import { SEVERITIES, type Alert, type AlertCreate } from '../domain/types';

@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly store: DomainStore,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async list(
    @Query('utility_id') utilityId?: string,
    @Query('severity') severity?: string,
  ): Promise<{ items: Alert[] }> {
    if (!utilityId) {
      throw new BadRequestException('utility_id query param is required');
    }
    const items = await this.store.listAlerts({ utilityId, severity });
    return { items };
  }

  @Post()
  @Roles(...WRITE_ROLES)
  async create(@Body() body: AlertCreate): Promise<{ id: string }> {
    if (!body?.utility_id || !body?.finding_id || !body?.severity) {
      throw new BadRequestException(
        'utility_id, finding_id, and severity are required',
      );
    }
    if (!SEVERITIES.includes(body.severity)) {
      throw new BadRequestException(`invalid severity: ${body.severity}`);
    }
    const id = this.store.nextId();
    const row: Alert = {
      id,
      finding_id: body.finding_id,
      utility_id: body.utility_id,
      severity: body.severity,
      inspection_id: body.inspection_id,
      sla_due_at: body.sla_due_at ?? null,
      ack_at: null,
    };
    await this.store.createAlert(row);
    return { id };
  }

  @Get(':alertId')
  async getOne(
    @Param('alertId') alertId: string,
    @CurrentUser() user?: AuthPrincipal,
  ): Promise<Alert> {
    const row = await this.store.getAlert(alertId);
    if (!row) {
      throw new NotFoundException(`alert ${alertId} not found`);
    }
    this.auth.assertUtilityAccess(user, row.utility_id);
    return row;
  }

  /** Operator ack — sets ack_at once; idempotent. */
  @Post(':alertId/ack')
  @Roles(...WRITE_ROLES)
  async ack(
    @Param('alertId') alertId: string,
    @CurrentUser() user?: AuthPrincipal,
  ): Promise<Alert> {
    const row = await this.store.getAlert(alertId);
    if (!row) {
      throw new NotFoundException(`alert ${alertId} not found`);
    }
    this.auth.assertUtilityAccess(user, row.utility_id);
    const acked = await this.store.ackAlert(alertId);
    if (!acked) {
      throw new NotFoundException(`alert ${alertId} not found`);
    }
    return acked;
  }
}
