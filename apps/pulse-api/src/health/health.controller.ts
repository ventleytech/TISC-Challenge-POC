import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth(): { status: string; service: string } {
    return { status: 'ok', service: 'pulse-api' };
  }
}
