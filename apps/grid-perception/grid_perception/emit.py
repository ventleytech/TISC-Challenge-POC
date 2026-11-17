"""Build vp.detect.v1 JSON payloads from raw boxes."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

VALID_CLASS_IDS = frozenset(
    {"crack", "sag", "corrosion", "vegetation", "thermal_hotspot"}
)


def new_uuid() -> str:
    return str(uuid.uuid4())


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )


def map_class_id(raw_label: str, label_map: dict[str, str]) -> str | None:
    if raw_label in label_map:
        mapped = label_map[raw_label]
    else:
        mapped = raw_label
    if mapped in VALID_CLASS_IDS:
        return mapped
    return None


def build_detect_event(
    *,
    detections_raw: list[dict[str, Any]],
    label_map: dict[str, str],
    inspection_id: str | None = None,
    asset_id: str | None = None,
    source: str = "upload",
) -> dict[str, Any]:
    """Assemble a vp.detect.v1 object. bbox is xyxy pixels."""
    if source not in ("live", "upload", "thermal_media"):
        raise ValueError(f"invalid source: {source}")

    detections: list[dict[str, Any]] = []
    for item in detections_raw:
        class_id = map_class_id(str(item["label"]), label_map)
        if class_id is None:
            continue
        conf = float(item["confidence"])
        if conf < 0.0 or conf > 1.0:
            raise ValueError(f"confidence out of range: {conf}")
        det: dict[str, Any] = {
            "detection_id": item.get("detection_id") or new_uuid(),
            "class_id": class_id,
            "confidence": conf,
        }
        bbox = item.get("bbox")
        if bbox is not None:
            if len(bbox) != 4:
                raise ValueError("bbox must be xyxy length 4")
            det["bbox"] = [float(x) for x in bbox]
        if item.get("evidence_object_id") is not None:
            det["evidence_object_id"] = item["evidence_object_id"]
        detections.append(det)

    event: dict[str, Any] = {
        "event_id": new_uuid(),
        "occurred_at": utc_now_iso(),
        "inspection_id": inspection_id or new_uuid(),
        "asset_id": asset_id,
        "source": source,
        "detections": detections,
    }
    return event


def assert_detect_shape(event: dict[str, Any]) -> None:
    """Structural check against vp.detect.v1 required fields (no jsonschema dep)."""
    for key in ("event_id", "occurred_at", "inspection_id", "detections"):
        if key not in event:
            raise AssertionError(f"missing required key: {key}")
    if not isinstance(event["detections"], list):
        raise AssertionError("detections must be a list")
    for det in event["detections"]:
        for key in ("detection_id", "class_id", "confidence"):
            if key not in det:
                raise AssertionError(f"detection missing {key}")
        if det["class_id"] not in VALID_CLASS_IDS:
            raise AssertionError(f"bad class_id: {det['class_id']}")
        conf = det["confidence"]
        if not isinstance(conf, (int, float)) or conf < 0 or conf > 1:
            raise AssertionError(f"bad confidence: {conf}")
        if "bbox" in det and len(det["bbox"]) != 4:
            raise AssertionError("bbox must have 4 numbers")
