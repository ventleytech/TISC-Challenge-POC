import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { AdminTabs } from "../../components/AdminTabs";
import { loadOnboarding, saveOnboarding } from "../../mock/client";
import { ONBOARDING_STEPS } from "../../mock/data";

export function AdminOnboardingPage() {
  const { canWrite } = useAuth();
  const [steps, setSteps] = useState(() => loadOnboarding());

  function toggle(i: number) {
    if (!canWrite) return;
    const next = steps.map((v, idx) => (idx === i ? !v : v));
    setSteps(next);
    saveOnboarding(next);
  }

  const done = steps.filter(Boolean).length;

  return (
    <section className="catalog catalog--wide">
      <AdminTabs />
      <header className="catalog__header">
        <p className="catalog__eyebrow">Admin · onboarding</p>
        <h1 className="catalog__title">Utility checklist</h1>
        <p className="catalog__summary">
          TDD §6.1 nine steps — {done}/{ONBOARDING_STEPS.length} complete.
        </p>
      </header>

      <ol className="onboard-list">
        {ONBOARDING_STEPS.map((label, i) => (
          <li key={label}>
            <label className="onboard-list__row">
              <input
                type="checkbox"
                checked={Boolean(steps[i])}
                disabled={!canWrite}
                onChange={() => toggle(i)}
              />
              <span>
                <strong>
                  {i + 1}. {label}
                </strong>
                {i === 3 ? (
                  <>
                    {" "}
                    <Link to="/admin/config">CSV import</Link>
                  </>
                ) : null}
                {i === 8 ? (
                  <>
                    {" "}
                    <Link to="/inspections">Smoke path</Link>
                  </>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ol>
    </section>
  );
}
