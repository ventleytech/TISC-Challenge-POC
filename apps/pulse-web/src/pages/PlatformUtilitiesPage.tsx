import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createUtility, listUtilities } from "../mock/client";
import type { UtilityRow } from "../types/domain";

export function PlatformUtilitiesPage() {
  const { isPlatform, canWrite } = useAuth();
  const [items, setItems] = useState<UtilityRow[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setItems((await listUtilities()).items);
  }

  useEffect(() => {
    void reload();
  }, []);

  if (!isPlatform) {
    return <Navigate to="/" replace />;
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!canWrite || !name.trim()) return;
    setError(null);
    try {
      const res = await createUtility(name.trim());
      setMsg(
        `Created ${res.id}` +
          (res.admin?.api_key ? ` · admin key ${res.admin.api_key}` : ""),
      );
      setName("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">Platform · utilities</p>
        <h1 className="catalog__title">Utilities admin</h1>
        <p className="catalog__summary">
          platform_admin only — wires GET/POST /utilities. Processing/hardware
          profiles stubbed.
        </p>
      </header>

      <form className="wizard-panel wizard-panel--rich" onSubmit={(e) => void onCreate(e)}>
        <label className="filters__field">
          <span className="filters__label">Utility name</span>
          <input
            className="filters__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn--primary btn--sm">
          Seed utility
        </button>
        {msg ? <p className="catalog__summary">{msg}</p> : null}
        {error ? <p className="catalog__error">{error}</p> : null}
      </form>

      <table className="dense-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td className="mono">{u.id}</td>
              <td>{u.name}</td>
              <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="wizard-panel wizard-panel--rich" style={{ marginTop: "1rem" }}>
        <h2 className="catalog__subtitle">Processing / hardware (stub)</h2>
        <p className="catalog__summary">
          Sense-node profiles and hardware ceilings — placeholder for Demo Day;
          no Flink/DeepStream wiring in this wave.
        </p>
      </div>
    </section>
  );
}
