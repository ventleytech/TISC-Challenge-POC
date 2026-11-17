"""Ultralytics file predict → raw detection dicts."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from grid_perception.config import Settings


def _xyxy_from_result(result: Any, idx: int) -> list[float] | None:
    """Prefer axis-aligned box; fall back to OBB xyxy if present."""
    boxes = getattr(result, "boxes", None)
    if boxes is not None and len(boxes) > idx:
        xyxy = boxes.xyxy[idx].tolist()
        return [float(x) for x in xyxy]
    obb = getattr(result, "obb", None)
    if obb is not None and len(obb) > idx:
        # ultralytics OBB: .xyxy exists on many builds
        if hasattr(obb, "xyxy"):
            xyxy = obb.xyxy[idx].tolist()
            return [float(x) for x in xyxy]
    return None


def _label_conf(result: Any, idx: int) -> tuple[str, float] | None:
    boxes = getattr(result, "boxes", None)
    names = result.names if hasattr(result, "names") else {}
    if boxes is not None and len(boxes) > idx:
        cls_i = int(boxes.cls[idx].item())
        conf = float(boxes.conf[idx].item())
        label = names.get(cls_i, str(cls_i))
        return str(label), conf
    obb = getattr(result, "obb", None)
    if obb is not None and len(obb) > idx:
        cls_i = int(obb.cls[idx].item())
        conf = float(obb.conf[idx].item())
        label = names.get(cls_i, str(cls_i))
        return str(label), conf
    return None


def _n_preds(result: Any) -> int:
    boxes = getattr(result, "boxes", None)
    if boxes is not None and len(boxes):
        return len(boxes)
    obb = getattr(result, "obb", None)
    if obb is not None and len(obb):
        return len(obb)
    return 0


def predict_source(
    *,
    weights: Path,
    source: str | Path,
    settings: Settings,
) -> list[dict[str, Any]]:
    """Run YOLO/OBB predict; return list of {label, confidence, bbox}."""
    try:
        from ultralytics import YOLO
    except ImportError as exc:
        raise SystemExit(
            "ultralytics missing — activate "
            f"{settings.venv_path} or install deps. Docker image TBD."
        ) from exc

    if not weights.is_file():
        raise FileNotFoundError(f"weights not found: {weights}")

    model = YOLO(str(weights))
    results = model.predict(
        source=str(source),
        device=settings.device,
        conf=settings.conf,
        imgsz=settings.imgsz,
        verbose=False,
    )

    out: list[dict[str, Any]] = []
    for result in results:
        n = _n_preds(result)
        for i in range(n):
            lc = _label_conf(result, i)
            if lc is None:
                continue
            label, conf = lc
            bbox = _xyxy_from_result(result, i)
            row: dict[str, Any] = {"label": label, "confidence": conf}
            if bbox is not None:
                row["bbox"] = bbox
            out.append(row)
    return out


def run_detectors(
    *,
    settings: Settings,
    source: Path,
    detectors: list[str],
) -> list[dict[str, Any]]:
    """Run selected detectors; skip missing weights with warning."""
    merged: list[dict[str, Any]] = []
    ran = 0
    for name in detectors:
        path = settings.weights.get(name)
        if path is None:
            print(f"skip {name}: weight env not set", file=sys.stderr)
            continue
        if not path.is_file():
            print(f"skip {name}: missing file {path}", file=sys.stderr)
            continue
        print(f"predict {name} weights={path}", file=sys.stderr)
        merged.extend(
            predict_source(weights=path, source=source, settings=settings)
        )
        ran += 1
    if ran == 0:
        raise SystemExit("no detectors ran — set GP_WEIGHTS_* and check paths")
    return merged
