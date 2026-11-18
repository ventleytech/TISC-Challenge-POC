import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthPrincipal } from '../auth/principal';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { WRITE_ROLES } from '../auth/roles';
import { EvidenceService } from './evidence.service';
import type { EvidenceCreate, EvidenceObject } from './evidence.types';

@Controller('evidence')
export class EvidenceController {
  constructor(
    private readonly evidence: EvidenceService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async list(
    @Query('utility_id') utilityId?: string,
    @Query('inspection_id') inspectionId?: string,
    @Query('finding_id') findingId?: string,
    @Query('kind') kind?: string,
  ): Promise<{ items: EvidenceObject[] }> {
    if (!utilityId) {
      throw new BadRequestException('utility_id query param is required');
    }
    const items = await this.evidence.list({
      utilityId,
      inspectionId,
      findingId,
      kind,
    });
    return { items };
  }

  @Post()
  @Roles(...WRITE_ROLES)
  async create(@Body() body: EvidenceCreate): Promise<{ id: string }> {
    const meta = await this.evidence.create(body);
    return { id: meta.id };
  }

  @Get(':evidenceId')
  async getOne(
    @Param('evidenceId') evidenceId: string,
    @CurrentUser() user?: AuthPrincipal,
  ): Promise<EvidenceObject> {
    const row = await this.evidence.getView(evidenceId);
    this.auth.assertUtilityAccess(user, row.utility_id);
    return row;
  }

  /** Signed-URL proxy: bytes stream from the object store; HMAC replaces API key. */
  @Public()
  @Get(':evidenceId/content')
  @Header('Cache-Control', 'private, max-age=60')
  async content(
    @Param('evidenceId') evidenceId: string,
    @Query('exp') exp?: string,
    @Query('sig') sig?: string,
  ): Promise<StreamableFile> {
    const { body, contentType } = await this.evidence.readSigned(
      evidenceId,
      exp,
      sig,
    );
    return new StreamableFile(body, { type: contentType });
  }
}
