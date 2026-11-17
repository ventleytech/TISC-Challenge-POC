import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import type { AuthPrincipal } from './principal';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (!this.auth.enabled) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: AuthPrincipal;
    }>();

    const credential = extractCredential(req.headers);
    const principal = this.auth.resolveCredential(credential);
    if (!principal) {
      throw new UnauthorizedException(
        'missing or invalid credentials (X-API-Key or Authorization: Bearer)',
      );
    }
    req.user = principal;
    return true;
  }
}

function extractCredential(
  headers: Record<string, string | string[] | undefined>,
): string | undefined {
  const apiKeyHeader = headerValue(headers['x-api-key']);
  if (apiKeyHeader) {
    return apiKeyHeader.trim();
  }

  const authorization = headerValue(headers.authorization);
  if (!authorization) {
    return undefined;
  }
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim();
}

function headerValue(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
