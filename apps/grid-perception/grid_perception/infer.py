"""Ultralytics file predict → raw detection dicts (+ honest fallbacks)."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from grid_perception.config import FALLBACK_DETECTORS, Settings


def _ensure_detector_fallbacks_on_path(repo_root: Path) -> None:
    pkg = (repo_root / "packages" / "detector-fallbacks").resolve()
    if not pkg.is_dir():
        raise FileNotFoundError(f"detector-fallbacks package missing: {pkg}")
    path = str(pkg)
    if path not in sys.path:
        sys.path.insert(0, path)


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


def run_fallback_detector(
    *,
    class_id: str,
    source: Path,
    settings: Settings,
    repo_root: Path,
) -> tuple[list[dict[str, Any]], dict[str, str]]:
    """
    Honest stub via packages/detector-fallbacks.

    Returns (raw detections for emit, fallback_reasons row).
    Default: empty detections + documented reason (no fake accuracy).
    """
    _ensure_detector_fallbacks_on_path(repo_root)
    try:
        from detector_fallbacks import run_fallback
    except ImportError as exc:
        raise SystemExit(
            "detector_fallbacks import failed — expected "
            f"{repo_root / 'packages' / 'detector-fallbacks'}"
        ) from exc

    result = run_fallback(
        class_id,
        source=str(source),
        emit_low_conf_sentinel=settings.fallback_sentinel,
    )
    raw: list[dict[str, Any]] = []
    for det in result["detections"]:
        row: dict[str, Any] = {
            "label": det.get("label", class_id),
            "confidence": float(det["confidence"]),
            "reason": result["fallback_reason"],
        }
        if "bbox" in det:
            row["bbox"] = det["bbox"]
        raw.append(row)

    meta = {
        "class_id": class_id,
        "reason": result["fallback_reason"],
        "status": result["status"],
    }
    print(
        f"fallback {class_id} status={result['status']} "
        f"detections={len(raw)} sentinel={settings.fallback_sentinel}",
        file=sys.stderr,
    )
    return raw, meta


def run_detectors(
    *,
    settings: Settings,
    source: Path,
    detectors: list[str],
    repo_root: Path | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, str]]]:
    """
    Run selected detectors; route sag/thermal_hotspot to fallbacks.

    Returns (merged raw detections, fallback_reasons for vp.detect.v1).
    """
    root = repo_root or Path(__file__).resolve().parents[3]
    merged: list[dict[str, Any]] = []
    fallback_reasons: list[dict[str, str]] = []
    ran = 0
    for name in detectors:
        if name in FALLBACK_DETECTORS:
            raw, meta = run_fallback_detector(
                class_id=name,
                source=source,
                settings=settings,
                repo_root=root,
            )
            merged.extend(raw)
            fallback_reasons.append(meta)
            ran += 1
            continue

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
        raise SystemExit(
            "no detectors ran — set GP_WEIGHTS_* or request sag/thermal_hotspot fallbacks"
        )
    return merged, fallback_reasons
