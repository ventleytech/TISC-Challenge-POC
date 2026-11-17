import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  assetsForScheduleKind,
  createInspection,
} from "../mock/client";
import { DEMO_UTILITY_ID } from "../mock/data";
import {
  SCHEDULE_KINDS,
  type ScheduleKind,
} from "../types/domain";

function isScheduleKind(value: string): value is ScheduleKind {
  return (SCHEDULE_KINDS as readonly string[]).includes(value);
}

const steps = ["Asset", "Plan", "Confirm"] as const;

export function ScheduleWizardPage() {
  const { kind: kindParam = "" } = useParams();
  const kindOk = isScheduleKind(kindParam);
  const kind: ScheduleKind = kindOk ? kindParam : "line";
  const navigate = useNavigate();

  const candidates = useMemo(() => assetsForScheduleKind(kind), [kind]);
  const [step, setStep] = useState(0);
  const [assetId, setAssetId] = useState(() => candidates[0]?.id ?? "");
  const [plannedAt, setPlannedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  if (!kindOk) {
    return <Navigate to="/inspections/schedule" replace />;
  }

  async function onConfirm(e: FormEvent) {
    e.preventDefault();
    if (!assetId) {
      setError("Select an asset");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { id } = await createInspection({
        utility_id: DEMO_UTILITY_ID,
        asset_ids: [assetId],
        schedule_kind: kind,
        planned_at: plannedAt ? new Date(plannedAt).toISOString() : null,
      });
      setCreatedId(id);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="catalog">
      <p className="catalog__eyebrow">
        <Link to="/inspections/schedule">Schedule</Link> / {kind}
      </p>
      <h1 className="catalog__title">{kind} wizard</h1>
      <p className="catalog__summary">
        Thin shell — three steps, mock create. No GIS.
      </p>

      <ol className="wizard-steps" aria-label="Wizard steps">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`wizard-steps__item${i === step ? " is-active" : ""}${i < step ? " is-done" : ""}`}
          >
            {label}
          </li>
        ))}
      </ol>

      {error ? <p className="catalog__error">{error}</p> : null}

      {step === 0 ? (
        <form
          className="wizard-panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (!assetId) {
              setError("Select an asset");
              return;
            }
            setError(null);
            setStep(1);
          }}
        >
          <fieldset className="wizard-fieldset">
            <legend>Select {kind} asset</legend>
            {candidates.length === 0 ? (
              <p className="catalog__empty">No mock assets for this kind.</p>
            ) : (
              candidates.map((a) => (
                <label key={a.id} className="wizard-option">
                  <input
                    type="radio"
                    name="asset"
                    value={a.id}
                    checked={assetId === a.id}
                    onChange={() => setAssetId(a.id)}
                  />
                  <span>
                    {a.name}
                    <span className="wizard-option__meta">
                      {a.criticality ?? "—"} · {a.voltage_class ?? "—"}
                    </span>
                  </span>
                </label>
              ))
            )}
          </fieldset>
          <div className="wizard-actions">
            <button type="submit" className="btn btn--primary" disabled={!assetId}>
              Next
            </button>
          </div>
        </form>
      ) : null}

      {step === 1 ? (
        <form className="wizard-panel" onSubmit={onConfirm}>
          <label className="filters__field">
            <span className="filters__label">Planned at</span>
            <input
              className="filters__input"
              type="datetime-local"
              value={plannedAt}
              onChange={(e) => setPlannedAt(e.target.value)}
            />
          </label>
          <div className="wizard-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setStep(0)}
            >
              Back
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create planned"}
            </button>
          </div>
        </form>
      ) : null}

      {step === 2 && createdId ? (
        <div className="wizard-panel">
          <p className="catalog__summary">
            Created planned inspection <strong>{createdId}</strong> for {kind}.
          </p>
          <div className="wizard-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void navigate("/inspections")}
            >
              Back to inspections
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
