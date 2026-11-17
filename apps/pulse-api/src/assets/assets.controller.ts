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
import { MemoryStore } from '../domain/memory.store';
import type { Asset, AssetCreate } from '../domain/types';

@Controller('assets')
export class AssetsController {
  constructor(private readonly store: MemoryStore) {}

  @Get()
  list(@Query('utility_id') utilityId?: string): { items: Asset[] } {
    if (!utilityId) {
      throw new BadRequestException('utility_id query param is required');
    }
    const items = [...this.store.assets.values()].filter(
      (a) => a.utility_id === utilityId,
    );
    return { items };
  }

  @Post()
  create(@Body() body: AssetCreate): { id: string } {
    if (!body?.utility_id || !body?.name) {
      throw new BadRequestException('utility_id and name are required');
    }
    const id = this.store.nextId();
    const row: Asset = {
      id,
      utility_id: body.utility_id,
      name: body.name,
      criticality: body.criticality,
      voltage_class: body.voltage_class ?? null,
    };
    this.store.assets.set(id, row);
    return { id };
  }

  @Get(':assetId')
  getOne(@Param('assetId') assetId: string): Asset {
    const row = this.store.assets.get(assetId);
    if (!row) {
      throw new NotFoundException(`asset ${assetId} not found`);
    }
    return row;
  }
}
