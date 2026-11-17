import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthPrincipal } from './principal';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPrincipal | undefined => {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthPrincipal }>();
    return req.user;
  },
);
