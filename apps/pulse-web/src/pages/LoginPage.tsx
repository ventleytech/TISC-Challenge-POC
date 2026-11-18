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
    <div className="login">
      <div className="login__panel">
        <div className="login__brand">
          <span className="rail__glyph" aria-hidden="true" />
          <div>
            <h1>TPulse</h1>
            <p>Transmission Pulse · API-key lab login</p>
          </div>
        </div>

        <p className="login__mode">
          {liveApiEnabled()
            ? "Live-by-default · X-API-Key → GET /me"
            : "Mock mode · offline stub principals"}
        </p>

        <form className="login__form" onSubmit={(e) => void onSubmit(e)}>
          <label className="filters__field">
            <span className="filters__label">Stub principal</span>
            <select
              className="filters__select"
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

          <label className="filters__field">
            <span className="filters__label">Or paste API key</span>
            <input
              className="filters__input"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="dev-operator"
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          {error ? <p className="catalog__error">{error}</p> : null}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="login__hint">
          Viewer cannot ack, schedule, or create. Platform admin unlocks
          /platform.
        </p>
      </div>
    </div>
  );
}
