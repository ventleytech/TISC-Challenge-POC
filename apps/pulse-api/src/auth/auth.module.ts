import { Global, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { MeController } from './me.controller';
import { RolesGuard } from './roles.guard';
import { UtilityScopeInterceptor } from './utility-scope.interceptor';

@Global()
@Module({
  controllers: [MeController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: UtilityScopeInterceptor },
  ],
  exports: [AuthService],
})
export class AuthModule {}
