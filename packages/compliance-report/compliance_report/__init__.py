"""VoltPulse compliance report stub (W06) — HTML toward PDF."""

from __future__ import annotations

from compliance_report.render import render_html, write_report
from compliance_report.summary import InspectionSummary, parse_summary

__version__ = "0.1.0"

__all__ = [
    "InspectionSummary",
    "parse_summary",
    "render_html",
    "write_report",
    "__version__",
]
