import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createTask, listTasks, patchTask } from "../mock/client";
import type { Task } from "../types/domain";

export function TasksPage() {
  const { canWrite } = useAuth();
  const [items, setItems] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("Crew North");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await listTasks();
    setItems(res.items);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    if (!title.trim()) {
      setError("Title required");
      return;
    }
    setError(null);
    await createTask({
      title: title.trim(),
      assignee,
      due_at: due ? new Date(due).toISOString() : null,
    });
    setTitle("");
    await reload();
  }

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">TPulse · tasks</p>
        <h1 className="catalog__title">Work queue</h1>
        <p className="catalog__summary">
          Mock-first tasks (work-orders API is export-only). Assign finding work
          with due dates.
        </p>
      </header>

      <form className="wizard-panel wizard-panel--rich" onSubmit={(e) => void onCreate(e)}>
        <h2 className="catalog__subtitle">Create task</h2>
        <div className="filters">
          <label className="filters__field">
            <span className="filters__label">Title</span>
            <input
              className="filters__input"
              value={title}
              disabled={!canWrite}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Assignee</span>
            <input
              className="filters__input"
              value={assignee}
              disabled={!canWrite}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Due</span>
            <input
              className="filters__input"
              type="datetime-local"
              value={due}
              disabled={!canWrite}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
        </div>
        {error ? <p className="catalog__error">{error}</p> : null}
        <button type="submit" className="btn btn--primary btn--sm" disabled={!canWrite}>
          Create
        </button>
      </form>

      <table className="dense-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Assignee</th>
            <th>Due</th>
            <th>Status</th>
            <th>Links</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <td>
                <strong>{t.title}</strong>
                <div className="mono">{t.id}</div>
              </td>
              <td>{t.assignee}</td>
              <td>{t.due_at ? new Date(t.due_at).toLocaleString() : "—"}</td>
              <td>
                <span className={`chip chip--status-${t.status === "done" ? "closed" : "in_progress"}`}>
                  {t.status}
                </span>
              </td>
              <td>
                {t.finding_id ? (
                  <Link to={`/findings/${t.finding_id}`}>{t.finding_id}</Link>
                ) : (
                  "—"
                )}
              </td>
              <td>
                {t.status !== "done" ? (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    disabled={!canWrite}
                    onClick={() =>
                      void patchTask(t.id, { status: "done" }).then(reload)
                    }
                  >
                    Complete
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
