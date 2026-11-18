/** API-key stub session — localStorage → X-API-Key → GET /me */

export type EnergyRole =
  | "platform_admin"
  | "utility_admin"
  | "energy_supervisor"
  | "energy_operator"
  | "viewer";

export type MePrincipal = {
  role: EnergyRole | "anonymous" | string;
  utility_id: string | null;
  auth_enabled: boolean;
  /** Display name for profile rail */
  display_name?: string;
  /** Stub key used for this session */
  api_key?: string;
};

export type StubCredential = {
  key: string;
  role: EnergyRole;
  utility_id: string | null;
  label: string;
};

const STORAGE_KEY = "vp.api_key";

/** Demo credentials when live API or VITE_PULSE_MOCK=1. */
export const STUB_CREDENTIALS: StubCredential[] = [
  {
    key: "dev-operator",
    role: "energy_operator",
    utility_id: "util-demo-01",
    label: "Ops · energy_operator",
  },
  {
    key: "dev-supervisor",
    role: "energy_supervisor",
    utility_id: "util-demo-01",
    label: "Supervisor · energy_supervisor",
  },
  {
    key: "dev-admin",
    role: "utility_admin",
    utility_id: "util-demo-01",
    label: "Utility admin",
  },
  {
    key: "dev-viewer",
    role: "viewer",
    utility_id: "util-demo-01",
    label: "Viewer (read-only)",
  },
  {
    key: "dev-platform",
    role: "platform_admin",
    utility_id: null,
    label: "Platform admin",
  },
];

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredApiKey(key: string | null): void {
  try {
    if (!key) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, key);
  } catch {
    /* ignore quota */
  }
}

export function canMutate(role: string | undefined): boolean {
  return (
    role === "platform_admin" ||
    role === "utility_admin" ||
    role === "energy_supervisor" ||
    role === "energy_operator"
  );
}

export function isPlatformAdmin(role: string | undefined): boolean {
  return role === "platform_admin";
}

export function isAdminRole(role: string | undefined): boolean {
  return (
    role === "platform_admin" ||
    role === "utility_admin" ||
    role === "energy_supervisor"
  );
}

/** Offline mock /me when VITE_PULSE_MOCK=1 or API unreachable. */
export function mockPrincipalFromKey(key: string): MePrincipal | null {
  const stub = STUB_CREDENTIALS.find((c) => c.key === key);
  if (!stub) return null;
  return {
    role: stub.role,
    utility_id: stub.utility_id,
    auth_enabled: true,
    display_name: stub.label,
    api_key: key,
  };
}
