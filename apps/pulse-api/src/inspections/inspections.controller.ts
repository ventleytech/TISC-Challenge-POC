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
import type { Inspection, InspectionCreate } from '../domain/types';

@Controller('inspections')
export class InspectionsController {
  constructor(
    private readonly store: MemoryStore,
    private readonly auth: AuthService,
  ) {}

  @Get()
  list(
    @Query('utility_id') utilityId?: string,
    @Query('status') status?: string,
  ): { items: Inspection[] } {
    if (!utilityId) {
      throw new BadRequestException('utility_id query param is required');
    }
    let items = [...this.store.inspections.values()].filter(
      (i) => i.utility_id === utilityId,
    );
    if (status) {
      items = items.filter((i) => i.status === status);
    }
    return { items };
  }

  @Post()
  @Roles(...WRITE_ROLES)
  create(@Body() body: InspectionCreate): { id: string } {
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
    this.store.inspections.set(id, row);
    return { id };
  }

  @Get(':inspectionId')
  getOne(
    @Param('inspectionId') inspectionId: string,
    @CurrentUser() user?: AuthPrincipal,
  ): Inspection {
    const row = this.store.inspections.get(inspectionId);
    if (!row) {
      throw new NotFoundException(`inspection ${inspectionId} not found`);
    }
    this.auth.assertUtilityAccess(user, row.utility_id);
    return row;
  }
}
