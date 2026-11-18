import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/AuthContext";
import { AdminTabs } from "../../components/AdminTabs";
import { listAdminUsers, upsertAdminUser } from "../../mock/client";
import { DEMO_UTILITY_ID } from "../../mock/data";
import type { AdminUser } from "../../types/domain";

export function AdminUsersPage() {
  const { canWrite, isAdmin } = useAuth();
  const [items, setItems] = useState<AdminUser[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("energy_operator");
  const [dept, setDept] = useState("NR-OPS");

  async function reload() {
    setItems((await listAdminUsers()).items);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!canWrite || !isAdmin) return;
    await upsertAdminUser({
      name: name.trim() || "New user",
      role,
      dept_code: dept,
      utility_id: DEMO_UTILITY_ID,
      api_key_hint: `stub-${role}`,
    });
    setName("");
    await reload();
  }

  return (
    <section className="catalog catalog--wide">
      <AdminTabs />
      <header className="catalog__header">
        <p className="catalog__eyebrow">Admin · users</p>
        <h1 className="catalog__title">Users & roles</h1>
        <p className="catalog__summary">
          Seeded directory + mock CRUD. Live membership APIs when present via
          /me roles.
        </p>
      </header>

      <form className="wizard-panel wizard-panel--rich" onSubmit={(e) => void onCreate(e)}>
        <div className="filters">
          <label className="filters__field">
            <span className="filters__label">Name</span>
            <input className="filters__input" value={name} onChange={(e) => setName(e.target.value)} disabled={!canWrite} />
          </label>
          <label className="filters__field">
            <span className="filters__label">Role</span>
            <select className="filters__select" value={role} onChange={(e) => setRole(e.target.value)} disabled={!canWrite}>
              <option value="energy_operator">energy_operator</option>
              <option value="energy_supervisor">energy_supervisor</option>
              <option value="utility_admin">utility_admin</option>
              <option value="viewer">viewer</option>
            </select>
          </label>
          <label className="filters__field">
            <span className="filters__label">Dept</span>
            <input className="filters__input" value={dept} onChange={(e) => setDept(e.target.value)} disabled={!canWrite} />
          </label>
        </div>
        <button type="submit" className="btn btn--primary btn--sm" disabled={!canWrite}>
          Add user
        </button>
      </form>

      <table className="dense-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Dept</th>
            <th>Key hint</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td className="mono">{u.role}</td>
              <td>{u.dept_code}</td>
              <td className="mono">{u.api_key_hint}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
