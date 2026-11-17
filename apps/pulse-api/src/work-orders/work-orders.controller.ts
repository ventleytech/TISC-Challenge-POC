import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { WorkOrdersService } from './work-orders.service';
import type {
  WorkOrderExportBody,
  WorkOrderExportFormat,
} from './work-orders.types';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrders: WorkOrdersService) {}

  /**
   * A07 export — JSON rows or CSV text via @voltpulse/work-order.
   * Auth + utility scope enforced by global guards/interceptor.
   */
  @Post('export')
  @HttpCode(200)
  async export(
    @Body() body: WorkOrderExportBody,
    @Query('format') formatQuery?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<unknown> {
    const format = normalizeFormat(formatQuery);
    const result = await this.workOrders.exportFromBody(body);

    if (format === 'csv') {
      res?.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res?.setHeader(
        'Content-Disposition',
        'attachment; filename="voltpulse-work-orders.csv"',
      );
      return result.csv;
    }

    res?.setHeader('Content-Type', 'application/json; charset=utf-8');
    return { items: result.rows };
  }
}

function normalizeFormat(raw: string | undefined): WorkOrderExportFormat {
  const value = (raw ?? 'json').trim().toLowerCase();
  if (value === 'json' || value === 'csv') {
    return value;
  }
  throw new BadRequestException('format must be json or csv');
}
