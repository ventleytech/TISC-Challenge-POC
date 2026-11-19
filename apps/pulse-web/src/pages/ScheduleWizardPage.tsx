import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  createInspection,
  listAssetsForScheduleKind,
  liveApiEnabled,
} from "../mock/client";
import { DEMO_UTILITY_ID } from "../mock/data";
import {
  SCHEDULE_KINDS,
  type Asset,
  type InspectionMode,
  type ScheduleKind,
} from "../types/domain";

function isScheduleKind(value: string): value is ScheduleKind {
  return (SCHEDULE_KINDS as readonly string[]).includes(value);
}

const steps = ["Asset", "Window", "Payload", "Confirm"] as const;

export function ScheduleWizardPage() {
  const { kind: kindParam = "" } = useParams();
  const kindOk = isScheduleKind(kindParam);
  const kind: ScheduleKind = kindOk ? kindParam : "line";
  const navigate = useNavigate();
  const { canWrite } = useAuth();

  const [candidates, setCandidates] = useState<Asset[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [assetId, setAssetId] = useState("");
  const [plannedAt, setPlannedAt] = useState("");
  const [outageWindow, setOutageWindow] = useState("");
  const [clearance, setClearance] = useState("");
  const [notes, setNotes] = useState("");
  const [payload, setPayload] = useState<"rgb" | "rgb_ir">("rgb_ir");
  const [mode, setMode] = useState<InspectionMode>("record_upload");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const items = await listAssetsForScheduleKind(kind);
        if (cancelled) return;
        setCandidates(items);
        setAssetId((prev) => prev || items[0]?.id || "");
        setLoadError(null);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load assets");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  if (!kindOk) {
    return <Navigate to="/inspections/schedule" replace />;
  }

  async function onConfirm(e: FormEvent) {
    e.preventDefault();
    if (!canWrite) {
      setError("Viewer cannot schedule");
      return;
    }
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
        mode,
        payload,
        outage_window: outageWindow || notes || null,
        clearance: clearance || null,
      });
      setCreatedId(id);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="catalog catalog--wide">
      <p className="catalog__eyebrow">
        <Link to="/inspections/schedule">Schedule</Link> / {kind}
      </p>
      <h1 className="catalog__title">{kind} wizard</h1>
      <p className="catalog__summary">
        Progress steps with outage window, payload, clearance — posts planned
        inspection
        {liveApiEnabled() ? " to live pulse-api" : " via mock client"}.
      </p>

      <ol className="wizard-steps wizard-steps--rich" aria-label="Wizard steps">
        {steps.map((label, i) => (
          <li
            key={label}
            className={`wizard-steps__item${i === step ? " is-active" : ""}${i < step ? " is-done" : ""}`}
          >
            <span className="wizard-steps__n">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      {loadError ? <p className="catalog__error">{loadError}</p> : null}
      {error ? <p className="catalog__error">{error}</p> : null}

      {step === 0 ? (
        <form
          className="wizard-panel wizard-panel--rich"
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
            {candidates.map((a) => (
              <label key={a.id} className="wizard-option wizard-option--rich">
                <input
                  type="radio"
                  name="asset"
                  value={a.id}
                  checked={assetId === a.id}
                  onChange={() => setAssetId(a.id)}
                />
                <span>
                  <strong>{a.name}</strong>
                  <span className="wizard-option__meta">
                    {a.criticality ?? "—"} · {a.voltage_class ?? "—"}
                    {a.oem ? ` · ${a.oem}` : ""}
                    {a.warranty_until ? ` · warranty ${a.warranty_until}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="wizard-actions">
            <button type="submit" className="btn btn--primary" disabled={!assetId}>
              Next · window
            </button>
          </div>
        </form>
      ) : null}

      {step === 1 ? (
        <form
          className="wizard-panel wizard-panel--rich"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
          }}
        >
          <label className="filters__field">
            <span className="filters__label">Planned at</span>
            <input
              className="filters__input"
              type="datetime-local"
              value={plannedAt}
              onChange={(e) => setPlannedAt(e.target.value)}
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Outage window</span>
            <input
              className="filters__input"
              value={outageWindow}
              onChange={(e) => setOutageWindow(e.target.value)}
              placeholder="e.g. 06:00–09:00 local · feeder F-14"
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Clearance / LOTO</span>
            <input
              className="filters__input"
              value={clearance}
              onChange={(e) => setClearance(e.target.value)}
              placeholder="Clearance ticket · ground crew"
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Crew notes</span>
            <textarea
              className="filters__input filters__textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <div className="wizard-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setStep(0)}>
              Back
            </button>
            <button type="submit" className="btn btn--primary">
              Next · payload
            </button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form className="wizard-panel wizard-panel--rich" onSubmit={onConfirm}>
          <label className="filters__field">
            <span className="filters__label">Mode</span>
            <select
              className="filters__select"
              value={mode}
              onChange={(e) => setMode(e.target.value as InspectionMode)}
            >
              <option value="record_upload">Record then upload</option>
              <option value="live_pull">Live pull</option>
            </select>
          </label>
          <label className="filters__field">
            <span className="filters__label">Payload</span>
            <select
              className="filters__select"
              value={payload}
              onChange={(e) => setPayload(e.target.value as "rgb" | "rgb_ir")}
            >
              <option value="rgb">RGB only</option>
              <option value="rgb_ir">RGB + IR</option>
            </select>
          </label>
          <div className="wizard-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting || !canWrite}
            >
              {submitting ? "Creating…" : "Create planned"}
            </button>
          </div>
        </form>
      ) : null}

      {step === 3 && createdId ? (
        <div className="wizard-panel wizard-panel--rich wizard-panel--done">
          <p className="catalog__summary">
            Created <strong className="mono">{createdId}</strong> · {mode.replace(/_/g, " ")} ·{" "}
            {payload === "rgb_ir" ? "RGB+IR" : "RGB"}
            {outageWindow ? ` · outage ${outageWindow}` : ""}
            {clearance ? ` · clearance set` : ""}.
          </p>
          <div className="wizard-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() =>
                void navigate(
                  mode === "live_pull"
                    ? `/inspections/${createdId}/live`
                    : `/inspections/${createdId}/upload`,
                )
              }
            >
              Start {mode === "live_pull" ? "live" : "upload"} session
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void navigate("/inspections")}
            >
              Open inspections
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
