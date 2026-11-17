import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PULSE_API_SETTINGS } from '../config/settings.module';
import type { PulseApiSettings } from '../config/settings';
import type { AuthPrincipal } from './principal';

@Injectable()
export class AuthService {
  /** Env stub keys + runtime onboarded principals (M01). */
  private readonly principals: Map<string, AuthPrincipal>;

  constructor(
    @Inject(PULSE_API_SETTINGS) private readonly settings: PulseApiSettings,
  ) {
    this.principals = new Map(settings.authPrincipals);
  }

  get enabled(): boolean {
    return this.settings.authEnabled;
  }

  resolveCredential(credential: string | undefined): AuthPrincipal | null {
    if (!credential) {
      return null;
    }
    return this.principals.get(credential) ?? null;
  }

  /**
   * Register a stub credential at runtime (utility onboarding).
   * Throws if key already mapped.
   */
  registerPrincipal(credential: string, principal: AuthPrincipal): void {
    const key = credential.trim();
    if (!key) {
      throw new BadRequestException('stub credential required');
    }
    if (this.principals.has(key)) {
      throw new ConflictException(`stub credential already registered: ${key}`);
    }
    this.principals.set(key, { ...principal, keyId: key });
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
