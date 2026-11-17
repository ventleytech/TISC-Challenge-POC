import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import type { AuthPrincipal } from './principal';

@Controller('me')
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  me(@CurrentUser() user?: AuthPrincipal): {
    role: string;
    utility_id: string | null;
    auth_enabled: boolean;
  } {
    if (this.auth.enabled && !user) {
      throw new UnauthorizedException('authenticated principal required');
    }
    return {
      role: user?.role ?? 'anonymous',
      utility_id: user?.utilityId ?? null,
      auth_enabled: this.auth.enabled,
    };
  }
}
