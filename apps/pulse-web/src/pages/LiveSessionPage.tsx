import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  getInspection,
  patchInspectionStatus,
} from "../mock/client";
import type { Inspection } from "../types/domain";

export function LiveSessionPage() {
  const { inspectionId = "" } = useParams();
  const { canWrite } = useAuth();
  const navigate = useNavigate();
  const [insp, setInsp] = useState<Inspection | null>(null);
  const [health, setHealth] = useState<"up" | "degraded" | "down">("up");
  const [elapsed, setElapsed] = useState(0);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    void getInspection(inspectionId).then(setInsp);
  }, [inspectionId]);

  useEffect(() => {
    const t = window.setInterval(() => setElapsed((n) => n + 1), 1000);
    const h = window.setInterval(() => {
      setHealth((cur) => (cur === "up" && Math.random() < 0.08 ? "degraded" : "up"));
    }, 4000);
    return () => {
      window.clearInterval(t);
      window.clearInterval(h);
    };
  }, []);

  async function onStop() {
    if (!canWrite) return;
    setStopping(true);
    await patchInspectionStatus(inspectionId, "processing");
    setStopping(false);
    void navigate("/inspections");
  }

  return (
    <section className="catalog catalog--wide session-page">
      <p className="catalog__eyebrow">
        <Link to="/inspections">Inspections</Link> / live session
      </p>
      <h1 className="catalog__title">Live inspect · {inspectionId}</h1>
      <p className="catalog__summary">
        Mock HLS preview pane — MediaMTX optional. Status:{" "}
        {insp?.status ?? "…"}. Stream health:{" "}
        <span className={`chip chip--pipe-${health === "up" ? "up" : "degraded"}`}>
          {health}
        </span>
      </p>

      <div className="session-page__grid">
        <div className="session-preview" aria-label="Live stream preview">
          <div className="session-preview__scan" aria-hidden="true" />
          <p className="session-preview__label">Mock live · RGB corridor</p>
          <p className="mono session-preview__clock">
            {Math.floor(elapsed / 60)
              .toString()
              .padStart(2, "0")}
            :{(elapsed % 60).toString().padStart(2, "0")}
          </p>
        </div>
        <aside className="wizard-panel wizard-panel--rich">
          <h2 className="catalog__subtitle">Session controls</h2>
          <p>Mode: live_pull · findings stream into review after stop.</p>
          <div className="wizard-actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canWrite || stopping}
              onClick={() => void onStop()}
            >
              {stopping ? "Stopping…" : "Stop → processing"}
            </button>
            <Link className="btn btn--ghost" to={`/inspections`}>
              Back
            </Link>
          </div>
          {!canWrite ? (
            <p className="catalog__error">Viewer cannot stop sessions.</p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
