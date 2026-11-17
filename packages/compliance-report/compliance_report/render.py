"""Render VoltPulse compliance HTML stub (toward PDF)."""

from __future__ import annotations

from html import escape
from pathlib import Path

from compliance_report.summary import DETECTION_IDS, InspectionSummary

STUB_BANNER = (
    "VoltPulse compliance report stub — HTML artifact toward PDF "
    "(no PDF engine in this package yet)."
)


def render_html(summary: InspectionSummary) -> str:
    """Build a single HTML document from an inspection summary."""
    title = summary.title or f"Compliance report — {summary.inspection_id}"
    status = summary.status or "n/a"
    generated = summary.generated_at or "n/a"
    total = sum(summary.findings_counts.values())

    rows = []
    for det in DETECTION_IDS:
        count = summary.findings_counts.get(det, 0)
        rows.append(
            f"<tr><td>{escape(det)}</td><td>{count}</td></tr>"
        )
    rows_html = "\n          ".join(rows)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="generator" content="voltpulse-compliance-report-stub" />
  <title>{escape(title)}</title>
  <style>
    :root {{
      --ink: #0f172a;
      --muted: #475569;
      --line: #cbd5e1;
      --band: #e2e8f0;
      --accent: #0f766e;
    }}
    body {{
      font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
      color: var(--ink);
      margin: 2rem auto;
      max-width: 48rem;
      line-height: 1.45;
    }}
    .banner {{
      background: var(--band);
      border-left: 4px solid var(--accent);
      padding: 0.75rem 1rem;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }}
    h1 {{ font-size: 1.6rem; margin: 0 0 0.25rem; }}
    .brand {{ color: var(--accent); letter-spacing: 0.04em; font-weight: 700; }}
    .meta {{ color: var(--muted); margin-bottom: 1.5rem; }}
    table {{ width: 100%; border-collapse: collapse; margin: 1rem 0; }}
    th, td {{ border: 1px solid var(--line); padding: 0.5rem 0.75rem; text-align: left; }}
    th {{ background: var(--band); }}
    .risk {{ font-size: 1.1rem; margin: 1rem 0; }}
    footer {{ margin-top: 2rem; color: var(--muted); font-size: 0.85rem; }}
  </style>
</head>
<body>
  <p class="banner" role="note">{escape(STUB_BANNER)}</p>
  <p class="brand">VoltPulse</p>
  <h1>{escape(title)}</h1>
  <p class="meta">
    utility_id: <strong>{escape(summary.utility_id)}</strong><br />
    inspection_id: <strong>{escape(summary.inspection_id)}</strong><br />
    status: {escape(status)} · generated_at: {escape(generated)}
  </p>
  <p class="risk">
    Risk: <strong>{escape(summary.risk.level)}</strong>
    (score {summary.risk.score:.3f})
  </p>
  <h2>Findings counts</h2>
  <p>Total findings: <strong>{total}</strong></p>
  <table>
    <thead>
      <tr><th>Detection</th><th>Count</th></tr>
    </thead>
    <tbody>
          {rows_html}
    </tbody>
  </table>
  <footer>
    Package: compliance-report · Brand: VoltPulse · Format: HTML stub toward PDF
  </footer>
</body>
</html>
"""


def write_report(summary: InspectionSummary, output_path: Path) -> Path:
    """Write HTML stub to disk; returns the path written."""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_html(summary), encoding="utf-8")
    return output_path
