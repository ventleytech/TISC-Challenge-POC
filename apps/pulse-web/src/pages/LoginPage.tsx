import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { STUB_CREDENTIALS } from "../auth/session";
import { liveApiEnabled } from "../mock/client";

export function LoginPage() {
  const { principal, login, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from &&
      (location.state as { from: string }).from !== "/login"
      ? (location.state as { from: string }).from
      : "/";

  const [key, setKey] = useState(STUB_CREDENTIALS[0].key);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (ready && principal) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(custom.trim() || key);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <span className="brand-symbol" aria-hidden="true">
            ϟ
          </span>
          <div>
            <h1>TPulse</h1>
            <p>Transmission Pulse · API-key lab login</p>
          </div>
        </div>

        <p className="live-pill" style={{ display: "inline-flex", marginBottom: 16 }}>
          {liveApiEnabled()
            ? "Live-by-default · X-API-Key → GET /me"
            : "Mock mode · offline stub principals"}
        </p>

        <form onSubmit={(e) => void onSubmit(e)}>
          <label>
            Stub principal
            <select
              className="field"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setCustom("");
              }}
            >
              {STUB_CREDENTIALS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label} ({c.key})
                </option>
              ))}
            </select>
          </label>

          <label>
            Or paste API key
            <input
              className="field"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="dev-operator"
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          {error ? <p className="catalog__error">{error}</p> : null}

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="muted" style={{ fontSize: 11, marginTop: 14 }}>
          Viewer cannot ack, schedule, or create. Platform admin unlocks
          /platform.
        </p>
      </div>
    </div>
  );
}
