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
import { MemoryStore } from '../domain/memory.store';
import { SEVERITIES, type Alert, type AlertCreate } from '../domain/types';

@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly store: MemoryStore,
    private readonly auth: AuthService,
  ) {}

  @Get()
  list(
    @Query('utility_id') utilityId?: string,
    @Query('severity') severity?: string,
  ): { items: Alert[] } {
    if (!utilityId) {
      throw new BadRequestException('utility_id query param is required');
    }
    let items = [...this.store.alerts.values()].filter(
      (a) => a.utility_id === utilityId,
    );
    if (severity) {
      items = items.filter((a) => a.severity === severity);
    }
    return { items };
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() body: AlertCreate): { id: string } {
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
    this.store.alerts.set(id, row);
    return { id };
  }

  @Get(':alertId')
  getOne(
    @Param('alertId') alertId: string,
    @CurrentUser() user?: AuthPrincipal,
  ): Alert {
    const row = this.store.alerts.get(alertId);
    if (!row) {
      throw new NotFoundException(`alert ${alertId} not found`);
    }
    this.auth.assertUtilityAccess(user, row.utility_id);
    return row;
  }
}
