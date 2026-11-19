import { useState } from "react";
import type { EvidenceObject } from "../types/domain";
import { EvidenceArt } from "./EvidenceArt";

/** Signed-URL image when live; procedural art in mock mode or on load error. */
export function EvidenceThumb({
  ev,
  className,
}: {
  ev: EvidenceObject;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImg =
    ev.content_url && !failed && (ev.content_type ?? "").startsWith("image/");
  return showImg ? (
    <img
      className={className}
      src={ev.content_url ?? undefined}
      alt={ev.label}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <EvidenceArt ev={ev} className={className} />
  );
}
