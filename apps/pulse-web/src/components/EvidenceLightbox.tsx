import { useEffect } from "react";
import type { EvidenceObject } from "../types/domain";
import { EvidenceArt } from "./EvidenceArt";

type Props = {
  items: EvidenceObject[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
};

export function EvidenceLightbox({ items, index, onClose, onIndex }: Props) {
  const ev = items[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex(Math.min(items.length - 1, index + 1));
      if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndex]);

  if (!ev) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Evidence lightbox">
      <button type="button" className="lightbox__scrim" aria-label="Close" onClick={onClose} />
      <div className="lightbox__panel">
        <header className="lightbox__head">
          <div>
            <h2>{ev.label}</h2>
            <p className="mono">{ev.id}</p>
          </div>
          <div className="lightbox__meta">
            <span className={`chip chip--retention-${ev.retention}`}>
              {ev.retention.replace(/_/g, " ")}
            </span>
            {ev.retention === "legal_hold" ? (
              <span className="lightbox__hold">Legal hold — do not purge</span>
            ) : null}
            <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
              Close
            </button>
          </div>
        </header>
        <div className="lightbox__stage">
          {ev.content_url ? (
            <img src={ev.content_url} alt={ev.label} className="lightbox__img" />
          ) : (
            <EvidenceArt ev={ev} className="lightbox__art" />
          )}
          {ev.bbox ? (
            <span
              className="lightbox__bbox"
              style={{
                left: `${(ev.bbox[0] / 640) * 100}%`,
                top: `${(ev.bbox[1] / 480) * 100}%`,
                width: `${(ev.bbox[2] / 640) * 100}%`,
                height: `${(ev.bbox[3] / 480) * 100}%`,
              }}
              aria-hidden="true"
            />
          ) : null}
        </div>
        <footer className="lightbox__foot">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={index <= 0}
            onClick={() => onIndex(index - 1)}
          >
            Prev
          </button>
          <span className="mono">
            {index + 1} / {items.length}
            {ev.content_url
              ? ` · signed URL${ev.content_expires_at ? ` · exp ${new Date(ev.content_expires_at).toLocaleTimeString()}` : ""}`
              : " · procedural preview"}
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={index >= items.length - 1}
            onClick={() => onIndex(index + 1)}
          >
            Next
          </button>
        </footer>
      </div>
    </div>
  );
}
