"""Inspection summary JSON → typed stub for compliance report."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

DETECTION_IDS = (
    "crack",
    "sag",
    "corrosion",
    "vegetation",
    "thermal_hotspot",
)

RISK_LEVELS = ("critical", "high", "medium", "low", "info")


class SummaryValidationError(ValueError):
    """Raised when inspection summary JSON fails stub contract checks."""


@dataclass(frozen=True)
class Risk:
    score: float
    level: str


@dataclass(frozen=True)
class InspectionSummary:
    inspection_id: str
    utility_id: str
    findings_counts: Mapping[str, int]
    risk: Risk
    status: str | None = None
    generated_at: str | None = None
    title: str | None = None


def _require_str(data: Mapping[str, Any], key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise SummaryValidationError(f"missing or empty string field: {key}")
    return value.strip()


def _parse_counts(raw: Any) -> dict[str, int]:
    if not isinstance(raw, Mapping):
        raise SummaryValidationError("findings_counts must be an object")
    counts: dict[str, int] = {det: 0 for det in DETECTION_IDS}
    for key, value in raw.items():
        if key not in DETECTION_IDS:
            raise SummaryValidationError(f"unknown detection id in findings_counts: {key}")
        if isinstance(value, bool) or not isinstance(value, int) or value < 0:
            raise SummaryValidationError(f"findings_counts[{key}] must be a non-negative int")
        counts[key] = value
    return counts


def _parse_risk(raw: Any) -> Risk:
    if not isinstance(raw, Mapping):
        raise SummaryValidationError("risk must be an object")
    score = raw.get("score")
    level = raw.get("level")
    if not isinstance(score, (int, float)) or isinstance(score, bool):
        raise SummaryValidationError("risk.score must be a number")
    if not isinstance(level, str) or not level.strip():
        raise SummaryValidationError("risk.level must be a non-empty string")
    level_norm = level.strip().lower()
    if level_norm not in RISK_LEVELS:
        raise SummaryValidationError(
            f"risk.level must be one of {', '.join(RISK_LEVELS)}"
        )
    return Risk(score=float(score), level=level_norm)


def parse_summary(data: Mapping[str, Any]) -> InspectionSummary:
    """Validate and normalize inspection summary mapping."""
    if not isinstance(data, Mapping):
        raise SummaryValidationError("summary root must be an object")

    status = data.get("status")
    if status is not None and (not isinstance(status, str) or not status.strip()):
        raise SummaryValidationError("status must be a non-empty string when set")

    generated_at = data.get("generated_at")
    if generated_at is not None and (
        not isinstance(generated_at, str) or not generated_at.strip()
    ):
        raise SummaryValidationError("generated_at must be a non-empty string when set")

    title = data.get("title")
    if title is not None and (not isinstance(title, str) or not title.strip()):
        raise SummaryValidationError("title must be a non-empty string when set")

    return InspectionSummary(
        inspection_id=_require_str(data, "inspection_id"),
        utility_id=_require_str(data, "utility_id"),
        findings_counts=_parse_counts(data.get("findings_counts")),
        risk=_parse_risk(data.get("risk")),
        status=status.strip() if isinstance(status, str) else None,
        generated_at=generated_at.strip() if isinstance(generated_at, str) else None,
        title=title.strip() if isinstance(title, str) else None,
    )
