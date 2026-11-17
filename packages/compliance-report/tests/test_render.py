#!/usr/bin/env python3
"""Unit checks for compliance-report summary parse + HTML stub."""

from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from compliance_report.render import STUB_BANNER, render_html, write_report  # noqa: E402
from compliance_report.summary import (  # noqa: E402
    SummaryValidationError,
    parse_summary,
)


FIXTURE = ROOT / "fixtures" / "sample_summary.json"


def _sample() -> dict:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def test_parse_sample() -> None:
    summary = parse_summary(_sample())
    assert summary.utility_id == "util-demo-01"
    assert summary.inspection_id.endswith("0120")
    assert summary.risk.level == "high"
    assert summary.findings_counts["corrosion"] == 5
    assert sum(summary.findings_counts.values()) == 8


def test_render_contains_brand_and_fields() -> None:
    html = render_html(parse_summary(_sample()))
    assert "VoltPulse" in html
    assert "toward PDF" in html
    assert STUB_BANNER.split("—")[0].strip() in html or "stub" in html.lower()
    assert "util-demo-01" in html
    assert "corrosion" in html
    assert "0.820" in html


def test_write_report_file() -> None:
    summary = parse_summary(_sample())
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "report.html"
        written = write_report(summary, out)
        assert written.is_file()
        text = written.read_text(encoding="utf-8")
        assert "utility_id" in text
        assert "Findings counts" in text


def test_missing_utility_id() -> None:
    data = _sample()
    del data["utility_id"]
    try:
        parse_summary(data)
        raise AssertionError("expected SummaryValidationError")
    except SummaryValidationError as exc:
        assert "utility_id" in str(exc)


def test_bad_risk_level() -> None:
    data = _sample()
    data["risk"] = {"score": 0.5, "level": "extreme"}
    try:
        parse_summary(data)
        raise AssertionError("expected SummaryValidationError")
    except SummaryValidationError as exc:
        assert "risk.level" in str(exc)


def test_unknown_detection_key() -> None:
    data = _sample()
    data["findings_counts"]["leak"] = 1
    try:
        parse_summary(data)
        raise AssertionError("expected SummaryValidationError")
    except SummaryValidationError as exc:
        assert "unknown detection id" in str(exc)


if __name__ == "__main__":
    test_parse_sample()
    test_render_contains_brand_and_fields()
    test_write_report_file()
    test_missing_utility_id()
    test_bad_risk_level()
    test_unknown_detection_key()
    print("PASS test_render")
