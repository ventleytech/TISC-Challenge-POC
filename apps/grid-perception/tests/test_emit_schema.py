#!/usr/bin/env python3
"""Unit check: emit builds vp.detect.v1 shape without GPU."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from grid_perception.config import DEFAULT_LABEL_MAP  # noqa: E402
from grid_perception.emit import (  # noqa: E402
    assert_detect_shape,
    build_detect_event,
    map_class_id,
)


def test_map_labels() -> None:
    assert map_class_id("severe-corrosion", DEFAULT_LABEL_MAP) == "corrosion"
    assert map_class_id("iso_broken_glass", DEFAULT_LABEL_MAP) == "crack"
    assert map_class_id("Powerline", DEFAULT_LABEL_MAP) == "vegetation"
    assert map_class_id("sag", DEFAULT_LABEL_MAP) == "sag"
    assert map_class_id("thermal_hotspot", DEFAULT_LABEL_MAP) == "thermal_hotspot"
    assert map_class_id("unknown_xyz", DEFAULT_LABEL_MAP) is None


def test_build_event() -> None:
    event = build_detect_event(
        detections_raw=[
            {
                "label": "moderate-corrosion",
                "confidence": 0.71,
                "bbox": [10.0, 20.0, 30.0, 40.0],
            },
            {"label": "Powerline", "confidence": 0.55, "bbox": [1, 2, 3, 4]},
            {"label": "junk", "confidence": 0.9},
        ],
        label_map=DEFAULT_LABEL_MAP,
        inspection_id="00000000-0000-4000-8000-000000000001",
        source="upload",
    )
    assert_detect_shape(event)
    assert len(event["detections"]) == 2
    assert event["detections"][0]["class_id"] == "corrosion"
    assert event["detections"][1]["class_id"] == "vegetation"
    assert event["source"] == "upload"
    assert "fallback_reasons" not in event


def test_build_event_with_fallback_reasons() -> None:
    event = build_detect_event(
        detections_raw=[],
        label_map=DEFAULT_LABEL_MAP,
        inspection_id="00000000-0000-4000-8000-000000000002",
        source="upload",
        fallback_reasons=[
            {
                "class_id": "sag",
                "reason": "No smoke-proven open conductor-sag detector on this host.",
                "status": "fallback",
            },
            {
                "class_id": "thermal_hotspot",
                "reason": "No calibrated utility IR camera or Gate0 thermal weight wired.",
                "status": "fallback",
            },
        ],
    )
    assert_detect_shape(event)
    assert event["detections"] == []
    assert len(event["fallback_reasons"]) == 2
    assert event["fallback_reasons"][0]["class_id"] == "sag"
    assert "sag" in event["fallback_reasons"][0]["reason"].lower()


def test_optional_schema_file() -> None:
    schema_path = (
        Path(__file__).resolve().parents[3]
        / "packages/contracts/events/detect/vp.detect.v1.schema.json"
    )
    assert schema_path.is_file(), f"missing schema {schema_path}"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    assert "detections" in schema["properties"]
    assert "fallback_reasons" in schema["properties"]
    assert "reason" in schema["properties"]["detections"]["items"]["properties"]
    assert set(schema["required"]) >= {
        "event_id",
        "occurred_at",
        "inspection_id",
        "detections",
    }


if __name__ == "__main__":
    test_map_labels()
    test_build_event()
    test_build_event_with_fallback_reasons()
    test_optional_schema_file()
    print("PASS test_emit_schema")
