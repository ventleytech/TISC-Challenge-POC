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
import type { Inspection, InspectionCreate } from '../domain/types';

@Controller('inspections')
export class InspectionsController {
  constructor(
    private readonly store: DomainStore,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async list(
    @Query('utility_id') utilityId?: string,
    @Query('status') status?: string,
  ): Promise<{ items: Inspection[] }> {
    if (!utilityId) {
      throw new BadRequestException('utility_id query param is required');
    }
    const items = await this.store.listInspections({ utilityId, status });
    return { items };
  }

  @Post()
  @Roles(...WRITE_ROLES)
  async create(@Body() body: InspectionCreate): Promise<{ id: string }> {
    if (!body?.utility_id) {
      throw new BadRequestException('utility_id is required');
    }
    const id = this.store.nextId();
    const row: Inspection = {
      id,
      utility_id: body.utility_id,
      status: 'planned',
      asset_ids: body.asset_ids ?? [],
      planned_at: body.planned_at ?? null,
    };
    await this.store.createInspection(row);
    return { id };
  }

  @Get(':inspectionId')
  async getOne(
    @Param('inspectionId') inspectionId: string,
    @CurrentUser() user?: AuthPrincipal,
  ): Promise<Inspection> {
    const row = await this.store.getInspection(inspectionId);
    if (!row) {
      throw new NotFoundException(`inspection ${inspectionId} not found`);
    }
    this.auth.assertUtilityAccess(user, row.utility_id);
    return row;
  }
}
