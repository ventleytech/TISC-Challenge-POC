#!/usr/bin/env python3
"""Unit check: sag/thermal_hotspot route through detector-fallbacks (no GPU)."""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from grid_perception.config import Settings  # noqa: E402
from grid_perception.emit import assert_detect_shape, build_detect_event  # noqa: E402
from grid_perception.infer import run_detectors  # noqa: E402


def _settings(*, sentinel: bool = False) -> Settings:
    return Settings(
        detect_topic="vp.detect.v1",
        kafka_bootstrap="",
        device="cpu",
        conf=0.25,
        imgsz=640,
        source="",
        fallback_sentinel=sentinel,
    )


def test_empty_fallbacks_emit_reason() -> None:
    with tempfile.NamedTemporaryFile(suffix=".jpg") as tmp:
        source = Path(tmp.name)
        raw, reasons = run_detectors(
            settings=_settings(sentinel=False),
            source=source,
            detectors=["sag", "thermal_hotspot"],
            repo_root=REPO,
        )
    assert raw == []
    assert {r["class_id"] for r in reasons} == {"sag", "thermal_hotspot"}
    for row in reasons:
        assert row["status"] == "fallback"
        assert len(row["reason"]) > 20
        assert "tri" + "netra" not in row["reason"].lower()  # internal-brand guard

    event = build_detect_event(
        detections_raw=raw,
        label_map={"sag": "sag", "thermal_hotspot": "thermal_hotspot"},
        fallback_reasons=reasons,
    )
    assert_detect_shape(event)
    assert event["detections"] == []
    assert len(event["fallback_reasons"]) == 2


def test_sentinel_low_conf() -> None:
    with tempfile.NamedTemporaryFile(suffix=".jpg") as tmp:
        source = Path(tmp.name)
        raw, reasons = run_detectors(
            settings=_settings(sentinel=True),
            source=source,
            detectors=["sag"],
            repo_root=REPO,
        )
    assert len(raw) == 1
    assert raw[0]["label"] == "sag"
    assert float(raw[0]["confidence"]) <= 0.01
    assert "reason" in raw[0]
    assert reasons[0]["class_id"] == "sag"

    event = build_detect_event(
        detections_raw=raw,
        label_map={"sag": "sag"},
        fallback_reasons=reasons,
    )
    assert_detect_shape(event)
    assert len(event["detections"]) == 1
    assert event["detections"][0]["confidence"] <= 0.01
    assert event["detections"][0]["class_id"] == "sag"
    assert event["detections"][0]["reason"]


if __name__ == "__main__":
    test_empty_fallbacks_emit_reason()
    test_sentinel_low_conf()
    print("PASS test_fallback_route")
