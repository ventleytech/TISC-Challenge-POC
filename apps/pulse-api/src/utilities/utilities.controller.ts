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
  Criticality,
  Site,
  Utility,
  UtilityCreate,
  UtilityMembership,
  UtilitySeed,
} from '../domain/types';
import { parseAssetsCsv } from '../import/csv-assets';

@Controller('utilities')
export class UtilitiesController {
  constructor(
    private readonly store: DomainStore,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async list(@CurrentUser() user?: AuthPrincipal): Promise<{ items: Utility[] }> {
    const all = await this.store.listUtilities();
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
  async create(@Body() body: UtilityCreate): Promise<{
    id: string;
    admin: { api_key: string; role: 'utility_admin' };
  }> {
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
    await this.store.createUtility(row);

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
    await this.store.createMembership(membership);

    // Onboarding needs the stub key once; later cards use IdP.
    return {
      id,
      admin: { api_key: apiKey, role: 'utility_admin' },
    };
  }

  @Get(':utilityId')
  async getOne(
    @Param('utilityId') utilityId: string,
    @CurrentUser() user?: AuthPrincipal,
  ): Promise<Utility> {
    const row = await this.store.getUtility(utilityId);
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
    const utility = await this.store.getUtility(utilityId);
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
      await this.store.createSite(row);
      site_ids.push(siteId);
    }

    const asset_ids: string[] = [];
    for (const asset of assets) {
      const assetName = asset?.name?.trim();
      if (!assetName) {
        throw new BadRequestException('asset name is required');
      }
      if (asset.site_id) {
        const site = await this.store.getSite(asset.site_id);
        if (!site) {
          throw new BadRequestException(`unknown site_id ${asset.site_id}`);
        }
        if (site.utility_id !== utilityId) {
          throw new BadRequestException('site_id not in this utility');
        }
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

  @Post(':utilityId/import-csv')
  @Roles('platform_admin', 'utility_admin')
  async importCsv(
    @Param('utilityId') utilityId: string,
    @Body()
    body: { csv?: string; dry_run?: boolean },
    @CurrentUser() user?: AuthPrincipal,
  ): Promise<{
    dry_run: boolean;
    row_count: number;
    errors: string[];
    site_ids: string[];
    asset_ids: string[];
  }> {
    const utility = await this.store.getUtility(utilityId);
    if (!utility) {
      throw new NotFoundException(`utility ${utilityId} not found`);
    }
    this.auth.assertUtilityAccess(user, utilityId);
    const csv = body?.csv ?? '';
    const parsed = parseAssetsCsv(csv);
    const dryRun = body?.dry_run !== false;
    if (parsed.errors.length > 0) {
      if (dryRun) {
        return {
          dry_run: true,
          row_count: parsed.rows.length,
          errors: parsed.errors,
          site_ids: [],
          asset_ids: [],
        };
      }
      throw new BadRequestException({
        message: 'CSV validation failed',
        errors: parsed.errors,
      });
    }
    if (dryRun) {
      return {
        dry_run: true,
        row_count: parsed.rows.length,
        errors: [],
        site_ids: [],
        asset_ids: [],
      };
    }
    const siteByName = new Map<string, string>();
    const site_ids: string[] = [];
    const asset_ids: string[] = [];
    for (const row of parsed.rows) {
      let siteId: string | null = null;
      if (row.site_name) {
        const existing = siteByName.get(row.site_name);
        if (existing) {
          siteId = existing;
        } else {
          siteId = this.store.nextId();
          await this.store.createSite({
            id: siteId,
            utility_id: utilityId,
            name: row.site_name,
          });
          siteByName.set(row.site_name, siteId);
          site_ids.push(siteId);
        }
      }
      const assetId = this.store.nextId();
      const asset: Asset = {
        id: assetId,
        utility_id: utilityId,
        name: row.name,
        site_id: siteId,
        criticality: row.criticality as Criticality | undefined,
        voltage_class: row.voltage_class ?? null,
      };
      await this.store.createAsset(asset);
      asset_ids.push(assetId);
    }
    return {
      dry_run: false,
      row_count: parsed.rows.length,
      errors: [],
      site_ids,
      asset_ids,
    };
  }
}
