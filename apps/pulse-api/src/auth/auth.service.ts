import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PULSE_API_SETTINGS } from '../config/settings.module';
import type { PulseApiSettings } from '../config/settings';
import type { AuthPrincipal } from './principal';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PULSE_API_SETTINGS) private readonly settings: PulseApiSettings,
  ) {}

  get enabled(): boolean {
    return this.settings.authEnabled;
  }

  resolveCredential(credential: string | undefined): AuthPrincipal | null {
    if (!credential) {
      return null;
    }
    return this.settings.authPrincipals.get(credential) ?? null;
  }

  /**
   * Enforce utility tenancy. platform_admin may access any utility.
   * Other roles must match their bound utility_id.
   */
  assertUtilityAccess(
    principal: AuthPrincipal | undefined,
    resourceUtilityId: string,
  ): void {
    if (!this.enabled) {
      return;
    }
    if (!principal) {
      throw new ForbiddenException('authenticated principal required');
    }
    if (principal.role === 'platform_admin') {
      return;
    }
    if (!principal.utilityId) {
      throw new ForbiddenException('principal missing utility_id');
    }
    if (principal.utilityId !== resourceUtilityId) {
      throw new ForbiddenException('utility_id out of scope for principal');
    }
  }
}
