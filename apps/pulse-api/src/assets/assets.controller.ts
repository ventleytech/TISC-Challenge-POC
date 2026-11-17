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
import type { Asset, AssetCreate } from '../domain/types';

@Controller('assets')
export class AssetsController {
  constructor(
    private readonly store: DomainStore,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async list(
    @Query('utility_id') utilityId?: string,
  ): Promise<{ items: Asset[] }> {
    if (!utilityId) {
      throw new BadRequestException('utility_id query param is required');
    }
    const items = await this.store.listAssets({ utilityId });
    return { items };
  }

  @Post()
  @Roles(...WRITE_ROLES)
  async create(@Body() body: AssetCreate): Promise<{ id: string }> {
    if (!body?.utility_id || !body?.name) {
      throw new BadRequestException('utility_id and name are required');
    }
    const id = this.store.nextId();
    const row: Asset = {
      id,
      utility_id: body.utility_id,
      name: body.name,
      site_id: body.site_id ?? null,
      criticality: body.criticality,
      voltage_class: body.voltage_class ?? null,
    };
    await this.store.createAsset(row);
    return { id };
  }

  @Get(':assetId')
  async getOne(
    @Param('assetId') assetId: string,
    @CurrentUser() user?: AuthPrincipal,
  ): Promise<Asset> {
    const row = await this.store.getAsset(assetId);
    if (!row) {
      throw new NotFoundException(`asset ${assetId} not found`);
    }
    this.auth.assertUtilityAccess(user, row.utility_id);
    return row;
  }
}
