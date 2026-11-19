"""Upload detection crops to pulse-api evidence (MinIO/fs via Nest)."""

from __future__ import annotations

import base64
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

# Optional — CUDA/ultralytics images usually have Pillow; CPU alpine may not.
try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None  # type: ignore[assignment,misc]


def _xyxy_to_xywh(bbox: list[float]) -> list[float]:
    x1, y1, x2, y2 = (float(b) for b in bbox)
    return [x1, y1, max(0.0, x2 - x1), max(0.0, y2 - y1)]


def crop_bytes(source: Path, bbox_xyxy: list[float]) -> tuple[bytes, str]:
    """Return (bytes, content_type). Falls back to full frame when Pillow missing."""
    raw = source.read_bytes()
    suffix = source.suffix.lower()
    content_type = "image/png" if suffix == ".png" else "image/jpeg"
    if Image is None:
        return raw, content_type if suffix in (".jpg", ".jpeg", ".png") else "image/jpeg"
    with Image.open(source) as im:
        x1, y1, x2, y2 = (int(round(v)) for v in bbox_xyxy)
        x1 = max(0, min(x1, im.width - 1))
        y1 = max(0, min(y1, im.height - 1))
        x2 = max(x1 + 1, min(x2, im.width))
        y2 = max(y1 + 1, min(y2, im.height))
        cropped = im.crop((x1, y1, x2, y2))
        import io

        buf = io.BytesIO()
        fmt = "PNG" if content_type == "image/png" else "JPEG"
        cropped.save(buf, format=fmt)
        return buf.getvalue(), content_type


def post_evidence(
    *,
    api_base: str,
    api_key: str,
    body: dict[str, Any],
    timeout_s: float = 10.0,
) -> str:
    """POST /evidence → evidence id. api_base includes /api/v1."""
    url = api_base.rstrip("/") + "/evidence"
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            **({"X-API-Key": api_key} if api_key else {}),
        },
    )
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    eid = payload.get("id")
    if not eid:
        raise RuntimeError(f"evidence create missing id: {payload!r}")
    return str(eid)


def attach_crops(
    *,
    source: Path,
    detections_raw: list[dict[str, Any]],
    label_map: dict[str, str],
    utility_id: str,
    inspection_id: str,
    asset_id: str | None,
    api_base: str,
    api_key: str,
) -> list[dict[str, Any]]:
    """
    For each detection with bbox, upload crop (or frame+bbox) and set evidence_object_id.
    Failures log to stderr and leave the detection unchanged.
    """
    from grid_perception.emit import map_class_id

    out: list[dict[str, Any]] = []
    for item in detections_raw:
        row = dict(item)
        bbox = row.get("bbox")
        class_id = map_class_id(str(row.get("label", "")), label_map)
        if bbox is None or class_id is None or len(bbox) != 4:
            out.append(row)
            continue
        try:
            blob, content_type = crop_bytes(source, [float(x) for x in bbox])
            eid = post_evidence(
                api_base=api_base,
                api_key=api_key,
                body={
                    "utility_id": utility_id,
                    "inspection_id": inspection_id,
                    "kind": "crop",
                    "content_type": content_type,
                    "data_base64": base64.b64encode(blob).decode("ascii"),
                    "asset_id": asset_id,
                    "class_id": class_id,
                    "confidence": float(row.get("confidence", 0)),
                    "bbox": _xyxy_to_xywh([float(x) for x in bbox]),
                    "label": str(row.get("label", class_id)),
                },
            )
            row["evidence_object_id"] = eid
        except (OSError, urllib.error.URLError, urllib.error.HTTPError, RuntimeError, ValueError) as exc:
            print(f"evidence crop upload failed: {exc!r}", file=sys.stderr, flush=True)
        out.append(row)
    return out
