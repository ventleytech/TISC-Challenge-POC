import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchMe, liveApiEnabled, setSessionApiKey } from "../mock/client";
import {
  canMutate,
  getStoredApiKey,
  isAdminRole,
  isPlatformAdmin,
  mockPrincipalFromKey,
  setStoredApiKey,
  type MePrincipal,
} from "./session";

type AuthState = {
  ready: boolean;
  principal: MePrincipal | null;
  apiKey: string | null;
  live: boolean;
  degraded: boolean;
  login: (key: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  canWrite: boolean;
  isAdmin: boolean;
  isPlatform: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [principal, setPrincipal] = useState<MePrincipal | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [degraded, setDegraded] = useState(false);

  const applyKey = useCallback((key: string | null) => {
    setApiKey(key);
    setSessionApiKey(key);
    setStoredApiKey(key);
  }, []);

  const refreshMe = useCallback(async () => {
    const key = getStoredApiKey();
    if (!key) {
      setPrincipal(null);
      setLive(false);
      setDegraded(false);
      return;
    }
    applyKey(key);
    if (!liveApiEnabled()) {
      const mock = mockPrincipalFromKey(key);
      setPrincipal(mock);
      setLive(false);
      setDegraded(false);
      return;
    }
    try {
      const me = await fetchMe();
      if (me) {
        setPrincipal({
          ...me,
          display_name: me.display_name ?? me.role,
          api_key: key,
        });
        setLive(true);
        setDegraded(false);
        return;
      }
    } catch {
      /* fall through */
    }
    const mock = mockPrincipalFromKey(key);
    setPrincipal(mock);
    setLive(false);
    setDegraded(Boolean(mock));
  }, [applyKey]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshMe();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  const login = useCallback(
    async (key: string) => {
      const trimmed = key.trim();
      if (!trimmed) throw new Error("API key required");
      applyKey(trimmed);
      if (!liveApiEnabled()) {
        const mock = mockPrincipalFromKey(trimmed);
        if (!mock) throw new Error("Unknown stub key (mock mode)");
        setPrincipal(mock);
        setLive(false);
        setDegraded(false);
        return;
      }
      const me = await fetchMe();
      if (!me) {
        const mock = mockPrincipalFromKey(trimmed);
        if (!mock) throw new Error("Login failed — invalid key or API down");
        setPrincipal(mock);
        setLive(false);
        setDegraded(true);
        return;
      }
      setPrincipal({
        ...me,
        display_name: me.display_name ?? me.role,
        api_key: trimmed,
      });
      setLive(true);
      setDegraded(false);
    },
    [applyKey],
  );

  const logout = useCallback(() => {
    applyKey(null);
    setPrincipal(null);
    setLive(false);
    setDegraded(false);
  }, [applyKey]);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      principal,
      apiKey,
      live,
      degraded,
      login,
      logout,
      refreshMe,
      canWrite: canMutate(principal?.role),
      isAdmin: isAdminRole(principal?.role),
      isPlatform: isPlatformAdmin(principal?.role),
    }),
    [
      ready,
      principal,
      apiKey,
      live,
      degraded,
      login,
      logout,
      refreshMe,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
