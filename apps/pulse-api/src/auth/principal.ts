import type { EnergyRole } from './roles';

export type AuthPrincipal = {
  /** Stub credential id (API key / bearer token value). */
  keyId: string;
  role: EnergyRole;
  /** Null only for platform_admin (cross-utility). */
  utilityId: string | null;
};

export type AuthenticatedRequest = {
  user?: AuthPrincipal;
};
