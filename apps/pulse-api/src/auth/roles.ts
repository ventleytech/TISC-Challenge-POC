/** Energy roles from requirements / scenario S5 (C10 stub). */
export const ENERGY_ROLES = [
  'platform_admin',
  'utility_admin',
  'energy_supervisor',
  'energy_operator',
  'viewer',
] as const;

export type EnergyRole = (typeof ENERGY_ROLES)[number];

/** Roles allowed to mutate inspections / assets / alerts. */
export const WRITE_ROLES: readonly EnergyRole[] = [
  'platform_admin',
  'utility_admin',
  'energy_supervisor',
  'energy_operator',
] as const;

export function isEnergyRole(value: string): value is EnergyRole {
  return (ENERGY_ROLES as readonly string[]).includes(value);
}
