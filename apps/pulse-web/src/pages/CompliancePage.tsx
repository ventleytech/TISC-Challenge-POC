import { useState } from "react";
import { AdminTabs } from "../components/AdminTabs";
import { complianceReportUrl, liveApiEnabled } from "../mock/client";
import { DEMO_UTILITY_ID } from "../mock/data";

export function CompliancePage() {
  const [inspectionId, setInspectionId] = useState("");
  const href = complianceReportUrl(
    DEMO_UTILITY_ID,
    inspectionId.trim() || undefined,
  );

  return (
    <section className="catalog catalog--wide">
      <AdminTabs />
      <header className="catalog__header">
        <p className="catalog__eyebrow">Compliance · W06</p>
        <h1 className="catalog__title">Compliance export</h1>
        <p className="catalog__summary">
          Downloads HTML/CSV stub from GET /reports/compliance
          {liveApiEnabled() ? " (live)" : " (URL ready; mock offline)"}.
        </p>
      </header>

      <div className="wizard-panel wizard-panel--rich">
        <label className="filters__field">
          <span className="filters__label">Inspection id (optional)</span>
          <input
            className="filters__input"
            value={inspectionId}
            onChange={(e) => setInspectionId(e.target.value)}
            placeholder="insp-03"
          />
        </label>
        <div className="wizard-actions">
          <a className="btn btn--primary" href={href} target="_blank" rel="noreferrer">
            Open compliance report
          </a>
          <a
            className="btn btn--ghost"
            href={href}
            download={`compliance-${DEMO_UTILITY_ID}.html`}
          >
            Download stub
          </a>
        </div>
        <p className="mono catalog__summary">{href}</p>
      </div>
    </section>
  );
}
