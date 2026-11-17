import { SetMetadata } from '@nestjs/common';
import type { EnergyRole } from './roles';

export const ROLES_KEY = 'pulseRoles';
export const Roles = (...roles: EnergyRole[]) => SetMetadata(ROLES_KEY, roles);
