import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listIncidents } from "../mock/client";
import type { Incident } from "../types/domain";

export function IncidentsPage() {
  const [items, setItems] = useState<Incident[]>([]);

  useEffect(() => {
    void listIncidents().then((r) => setItems(r.items));
  }, []);

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">TPulse · incidents (P1 lite)</p>
        <h1 className="catalog__title">Incident cases</h1>
        <p className="catalog__summary">
          Groups of critical findings into outage-risk cases. Mock entity for
          Demo Day.
        </p>
      </header>

      <ul className="incident-list">
        {items.map((inc) => (
          <li key={inc.id} className="wizard-panel wizard-panel--rich">
            <div className="catalog__title-row">
              <h2 className="catalog__subtitle">{inc.title}</h2>
              <span className={`badge badge--${inc.severity}`}>{inc.severity}</span>
            </div>
            <p className="catalog__summary">
              {inc.status} · {inc.dept_code ?? "—"} ·{" "}
              {new Date(inc.created_at).toLocaleString()}
            </p>
            <ul className="incident-list__findings">
              {inc.finding_ids.map((id) => (
                <li key={id}>
                  <Link to={`/findings/${id}`}>{id}</Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
