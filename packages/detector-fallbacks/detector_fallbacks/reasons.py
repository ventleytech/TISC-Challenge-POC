"""Documented Demo Day fallback reasons — no accuracy claims."""

from __future__ import annotations

# Keep reasons short, operator-facing, and free of proprietary product names.
FALLBACK_REASONS: dict[str, str] = {
    "sag": (
        "No smoke-proven open conductor-sag detector on this host. "
        "Public sag boxes are sparse; geometric/catenary baseline not yet wired. "
        "Demo Day: emit empty detections rather than fake confidence."
    ),
    "thermal_hotspot": (
        "No calibrated utility IR camera or Gate0 thermal weight wired. "
        "Public IR datasets exist for later plumbing; do not claim radiometric °C. "
        "Demo Day: emit empty detections rather than fake hotspots."
    ),
}
