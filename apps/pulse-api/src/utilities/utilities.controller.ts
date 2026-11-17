import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthPrincipal } from '../auth/principal';
import { Roles } from '../auth/roles.decorator';
import { DomainStore } from '../domain/domain.store';
import type {
  Asset,
  Site,
  Utility,
  UtilityCreate,
  UtilityMembership,
  UtilitySeed,
} from '../domain/types';

@Controller('utilities')
export class UtilitiesController {
  constructor(
    private readonly store: DomainStore,
    private readonly auth: AuthService,
  ) {}

  @Get()
  list(@CurrentUser() user?: AuthPrincipal): { items: Utility[] } {
    const all = [...this.store.utilities.values()];
    if (!this.auth.enabled || !user || user.role === 'platform_admin') {
      return { items: all };
    }
    if (!user.utilityId) {
      return { items: [] };
    }
    return {
      items: all.filter((u) => u.id === user.utilityId),
    };
  }

  @Post()
  @Roles('platform_admin')
  create(@Body() body: UtilityCreate): {
    id: string;
    admin: { api_key: string; role: 'utility_admin' };
  } {
    const name = body?.name?.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }

    const id = this.store.nextId();
    const row: Utility = {
      id,
      name,
      created_at: new Date().toISOString(),
    };
    this.store.utilities.set(id, row);

    const apiKey = body.admin_api_key?.trim() || `ua-${randomUUID()}`;
    this.auth.registerPrincipal(apiKey, {
      keyId: apiKey,
      role: 'utility_admin',
      utilityId: id,
    });

    const membership: UtilityMembership = {
      id: this.store.nextId(),
      utility_id: id,
      role: 'utility_admin',
      key_id: apiKey,
    };
    this.store.memberships.set(membership.id, membership);

    // Onboarding needs the stub key once; later cards use IdP.
    return {
      id,
      admin: { api_key: apiKey, role: 'utility_admin' },
    };
  }

  @Get(':utilityId')
  getOne(
    @Param('utilityId') utilityId: string,
    @CurrentUser() user?: AuthPrincipal,
  ): Utility {
    const row = this.store.utilities.get(utilityId);
    if (!row) {
      throw new NotFoundException(`utility ${utilityId} not found`);
    }
    this.auth.assertUtilityAccess(user, row.id);
    return row;
  }

  @Post(':utilityId/seed')
  @Roles('platform_admin', 'utility_admin')
  async seed(
    @Param('utilityId') utilityId: string,
    @Body() body: UtilitySeed,
    @CurrentUser() user?: AuthPrincipal,
  ): Promise<{ site_ids: string[]; asset_ids: string[] }> {
    const utility = this.store.utilities.get(utilityId);
    if (!utility) {
      throw new NotFoundException(`utility ${utilityId} not found`);
    }
    this.auth.assertUtilityAccess(user, utilityId);

    const sites = body?.sites ?? [];
    const assets = body?.assets ?? [];
    if (sites.length === 0 && assets.length === 0) {
      throw new BadRequestException('sites or assets required');
    }

    const site_ids: string[] = [];
    for (const site of sites) {
      const siteName = site?.name?.trim();
      if (!siteName) {
        throw new BadRequestException('site name is required');
      }
      const siteId = this.store.nextId();
      const row: Site = {
        id: siteId,
        utility_id: utilityId,
        name: siteName,
      };
      this.store.sites.set(siteId, row);
      site_ids.push(siteId);
    }

    const asset_ids: string[] = [];
    for (const asset of assets) {
      const assetName = asset?.name?.trim();
      if (!assetName) {
        throw new BadRequestException('asset name is required');
      }
      if (asset.site_id && !this.store.sites.has(asset.site_id)) {
        throw new BadRequestException(`unknown site_id ${asset.site_id}`);
      }
      if (
        asset.site_id &&
        this.store.sites.get(asset.site_id)?.utility_id !== utilityId
      ) {
        throw new BadRequestException('site_id not in this utility');
      }
      const assetId = this.store.nextId();
      const row: Asset = {
        id: assetId,
        utility_id: utilityId,
        name: assetName,
        site_id: asset.site_id ?? null,
        criticality: asset.criticality,
        voltage_class: asset.voltage_class ?? null,
      };
      await this.store.createAsset(row);
      asset_ids.push(assetId);
    }

    return { site_ids, asset_ids };
  }
}
