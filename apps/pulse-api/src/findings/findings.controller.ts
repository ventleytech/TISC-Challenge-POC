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
import {
  DETECTION_CLASSES,
  SEVERITIES,
  type Finding,
  type FindingCreate,
} from '../domain/types';

@Controller('findings')
export class FindingsController {
  constructor(
    private readonly store: MemoryStore,
    private readonly auth: AuthService,
  ) {}

  @Get()
  list(
    @Query('utility_id') utilityId?: string,
    @Query('inspection_id') inspectionId?: string,
  ): { items: Finding[] } {
    if (!utilityId) {
      throw new BadRequestException('utility_id query param is required');
    }
    let items = [...this.store.findings.values()].filter(
      (f) => f.utility_id === utilityId,
    );
    if (inspectionId) {
      items = items.filter((f) => f.inspection_id === inspectionId);
    }
    return { items };
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() body: FindingCreate): { id: string } {
    if (!body?.utility_id || !body?.class_id || !body?.severity) {
      throw new BadRequestException(
        'utility_id, class_id, and severity are required',
      );
    }
    if (!DETECTION_CLASSES.includes(body.class_id)) {
      throw new BadRequestException(`invalid class_id: ${body.class_id}`);
    }
    if (!SEVERITIES.includes(body.severity)) {
      throw new BadRequestException(`invalid severity: ${body.severity}`);
    }
    if (typeof body.risk_score !== 'number' || Number.isNaN(body.risk_score)) {
      throw new BadRequestException('risk_score must be a number');
    }
    const id = body.id?.trim() || this.store.nextId();
    if (this.store.findings.has(id)) {
      throw new BadRequestException(`finding ${id} already exists`);
    }
    const row: Finding = {
      id,
      utility_id: body.utility_id,
      class_id: body.class_id,
      severity: body.severity,
      risk_score: body.risk_score,
      inspection_id: body.inspection_id ?? null,
      asset_id: body.asset_id ?? null,
      source_detection_ids: body.source_detection_ids ?? [],
      evidence_object_ids: body.evidence_object_ids ?? [],
    };
    this.store.findings.set(id, row);
    return { id };
  }

  @Get(':findingId')
  getOne(
    @Param('findingId') findingId: string,
    @CurrentUser() user?: AuthPrincipal,
  ): Finding {
    const row = this.store.findings.get(findingId);
    if (!row) {
      throw new NotFoundException(`finding ${findingId} not found`);
    }
    this.auth.assertUtilityAccess(user, row.utility_id);
    return row;
  }
}
