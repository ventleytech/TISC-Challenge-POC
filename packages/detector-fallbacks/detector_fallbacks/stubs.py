"""Stub runners for catalog C04 detectors without Gate0 weights."""

from __future__ import annotations

from typing import Any, TypedDict

from detector_fallbacks.reasons import FALLBACK_REASONS

FALLBACK_CLASS_IDS: frozenset[str] = frozenset(FALLBACK_REASONS)

# Ceiling when a consumer opts into a sentinel row (still not a real find).
LOW_CONF_SENTINEL = 0.01


class FallbackResult(TypedDict):
    class_id: str
    status: str
    fallback_reason: str
    confidence_ceiling: float
    detections: list[dict[str, Any]]


def list_fallbacks() -> dict[str, str]:
    """Return class_id → reason map for Demo Day honesty docs."""
    return dict(FALLBACK_REASONS)


def run_fallback(
    class_id: str,
    *,
    source: str | None = None,
    emit_low_conf_sentinel: bool = False,
) -> FallbackResult:
    """
    Run an honest stub for a fallback detector.

    Default: empty detections. Optional sentinel emits one low-confidence row
    so class_id plumbing can be exercised without implying a real detection.
    `source` is accepted for API symmetry with perception ingest; unused.
    """
    if class_id not in FALLBACK_REASONS:
        known = ", ".join(sorted(FALLBACK_REASONS))
        raise ValueError(f"unknown fallback class_id={class_id!r}; known: {known}")

    _ = source  # reserved for future media-path notes
    detections: list[dict[str, Any]] = []
    if emit_low_conf_sentinel:
        detections.append(
            {
                "label": class_id,
                "confidence": LOW_CONF_SENTINEL,
                # ponytail: no bbox — stub has no localization; upgrade when real weights land
            }
        )

    return {
        "class_id": class_id,
        "status": "fallback",
        "fallback_reason": FALLBACK_REASONS[class_id],
        "confidence_ceiling": LOW_CONF_SENTINEL if emit_low_conf_sentinel else 0.0,
        "detections": detections,
    }
