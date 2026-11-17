import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import type { AuthPrincipal } from './principal';

/**
 * When auth is on, ensure query/body utility_id matches the principal
 * (platform_admin may cross utilities).
 */
@Injectable()
export class UtilityScopeInterceptor implements NestInterceptor {
  constructor(private readonly auth: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.auth.enabled) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<{
      user?: AuthPrincipal;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
    }>();

    const fromQuery = asString(req.query?.utility_id);
    const fromBody = asString(req.body?.utility_id);
    const utilityId = fromQuery ?? fromBody;

    if (utilityId) {
      this.auth.assertUtilityAccess(req.user, utilityId);
    } else if (
      req.user &&
      req.user.role !== 'platform_admin' &&
      (req.query && 'utility_id' in req.query)
    ) {
      // explicit empty utility_id query → bad request (controller also checks)
      throw new BadRequestException('utility_id query param is required');
    }

    return next.handle();
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
