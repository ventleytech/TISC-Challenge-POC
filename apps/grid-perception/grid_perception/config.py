"""Load perception settings from environment into a typed object."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

# Model class name → VoltPulse detection enum (packages/contracts/enums/detection.json)
DEFAULT_LABEL_MAP: dict[str, str] = {
    "corrosion": "corrosion",
    "moderate-corrosion": "corrosion",
    "severe-corrosion": "corrosion",
    "iso_broken_glass": "crack",
    "broken": "crack",
    "breakage": "crack",
    "crack": "crack",
    "Powerline": "vegetation",
    "powerline": "vegetation",
    "vegetation": "vegetation",
}

DETECTOR_WEIGHT_ENV = {
    "corrosion": "GP_WEIGHTS_CORROSION",
    "crack": "GP_WEIGHTS_CRACK",
    "vegetation": "GP_WEIGHTS_VEGETATION",
}


@dataclass(frozen=True)
class Settings:
    detect_topic: str
    kafka_bootstrap: str
    device: str
    conf: float
    imgsz: int
    source: str
    weights: dict[str, Path] = field(default_factory=dict)
    label_map: dict[str, str] = field(default_factory=lambda: dict(DEFAULT_LABEL_MAP))
    venv_path: str = ""


def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip()


def load_settings(repo_root: Path | None = None) -> Settings:
    """Build Settings from env. Weight paths resolved relative to repo_root when relative."""
    root = repo_root or Path.cwd()
    weights: dict[str, Path] = {}
    for detector, env_key in DETECTOR_WEIGHT_ENV.items():
        raw = _env(env_key)
        if not raw:
            continue
        p = Path(raw)
        if not p.is_absolute():
            p = (root / p).resolve()
        weights[detector] = p

    conf_raw = _env("GP_CONF", "0.25")
    imgsz_raw = _env("GP_IMGSZ", "640")
    return Settings(
        detect_topic=_env("PULSE_DETECT_TOPIC", "vp.detect.v1"),
        kafka_bootstrap=_env("PULSE_KAFKA_BOOTSTRAP", ""),
        device=_env("GP_DEVICE", "0"),
        conf=float(conf_raw),
        imgsz=int(imgsz_raw),
        source=_env("GP_SOURCE", ""),
        weights=weights,
        venv_path=_env("GP_VENV", "local-notes/models-experiments/_scratch/venv"),
    )
