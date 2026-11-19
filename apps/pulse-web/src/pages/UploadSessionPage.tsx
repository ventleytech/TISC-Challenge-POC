import { useEffect, useState, type DragEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getInspection, patchInspectionStatus } from "../mock/client";
import type { Inspection } from "../types/domain";

type FileSlot = { name: string; kind: "rgb" | "ir"; progress: number; error?: string };

export function UploadSessionPage() {
  const { inspectionId = "" } = useParams();
  const { canWrite } = useAuth();
  const navigate = useNavigate();
  const [insp, setInsp] = useState<Inspection | null>(null);
  const [files, setFiles] = useState<FileSlot[]>([]);
  const [enqueueing, setEnqueueing] = useState(false);

  useEffect(() => {
    void getInspection(inspectionId).then(setInsp);
  }, [inspectionId]);

  function addFiles(list: FileList | null, kind: "rgb" | "ir") {
    if (!list || !canWrite) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      next.push({ name: f.name, kind, progress: 0 });
    }
    setFiles(next);
    // mock progress
    next.forEach((_, i) => {
      const start = files.length;
      const idx = start + i;
      const tick = window.setInterval(() => {
        setFiles((cur) => {
          const copy = [...cur];
          if (!copy[idx]) return cur;
          copy[idx] = {
            ...copy[idx],
            progress: Math.min(100, copy[idx].progress + 18 + Math.random() * 20),
          };
          if (copy[idx].progress >= 100) window.clearInterval(tick);
          return copy;
        });
      }, 280);
    });
  }

  function onDrop(e: DragEvent, kind: "rgb" | "ir") {
    e.preventDefault();
    addFiles(e.dataTransfer.files, kind);
  }

  async function onEnqueue() {
    if (!canWrite) return;
    setEnqueueing(true);
    await patchInspectionStatus(inspectionId, "processing");
    setEnqueueing(false);
    void navigate("/inspections");
  }

  const ready = files.length > 0 && files.every((f) => f.progress >= 100);

  return (
    <section className="catalog catalog--wide session-page">
      <p className="catalog__eyebrow">
        <Link to="/inspections">Inspections</Link> / upload session
      </p>
      <h1 className="catalog__title">Upload inspect · {inspectionId}</h1>
      <p className="catalog__summary">
        Dropzone RGB / IR — mock progress when MinIO unavailable. Inspection:{" "}
        {insp?.status ?? "…"}.
      </p>

      <div className="session-page__grid">
        <div className="upload-zones">
          {(["rgb", "ir"] as const).map((kind) => (
            <div
              key={kind}
              className="upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, kind)}
            >
              <h2>{kind.toUpperCase()} media</h2>
              <p>Drop files or browse</p>
              <input
                type="file"
                accept={kind === "ir" ? "image/*,.tiff" : "image/*,video/*"}
                multiple
                disabled={!canWrite}
                onChange={(e) => addFiles(e.target.files, kind)}
              />
            </div>
          ))}
        </div>
        <aside className="wizard-panel wizard-panel--rich">
          <h2 className="catalog__subtitle">Upload queue</h2>
          {files.length === 0 ? (
            <p className="catalog__empty">No files yet.</p>
          ) : (
            <ul className="upload-list">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`}>
                  <span>
                    {f.kind.toUpperCase()} · {f.name}
                  </span>
                  <span className="mono">{Math.round(f.progress)}%</span>
                  <span className="upload-list__bar">
                    <i style={{ width: `${f.progress}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="wizard-actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canWrite || !ready || enqueueing}
              onClick={() => void onEnqueue()}
            >
              {enqueueing ? "Enqueueing…" : "Enqueue perception"}
            </button>
            <Link className="btn btn--ghost" to="/inspections">
              Cancel
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
