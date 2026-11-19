#!/usr/bin/env python3
"""Inbox loop: image in → JSONL line out; unrunnable detector → failed/ (no GPU needed)."""

from __future__ import annotations

import json
import sys
import tempfile
from dataclasses import replace
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from grid_perception.config import Settings  # noqa: E402
from grid_perception.loop import LoopStats, scan_once  # noqa: E402


def _settings(tmp: Path, **kw: object) -> Settings:
    base = Settings(
        detect_topic="vp.detect.v1",
        kafka_bootstrap="",
        device="cpu",
        conf=0.25,
        imgsz=640,
        source="",
        inbox_dir=str(tmp / "inbox"),
        detect_file=str(tmp / "bus" / "vp.detect.v1.jsonl"),
    )
    return replace(base, **kw)


def test_inbox_to_jsonl() -> None:
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        (tmp / "inbox").mkdir()
        (tmp / "inbox" / "a.jpg").write_bytes(b"x")
        (tmp / "inbox" / "notes.txt").write_text("skip")
        stats = LoopStats()
        assert scan_once(settings=_settings(tmp), repo_root=REPO, stats=stats) == 1
        lines = (tmp / "bus" / "vp.detect.v1.jsonl").read_text().splitlines()
        assert len(lines) == 1
        event = json.loads(lines[0])
        assert event["source"] == "upload"
        assert {r["class_id"] for r in event["fallback_reasons"]} == {"sag", "thermal_hotspot"}
        assert (tmp / "inbox" / "processed" / "a.jpg").is_file()
        assert (tmp / "inbox" / "notes.txt").is_file()
        assert (stats.processed, stats.failed) == (1, 0)
        # second scan: nothing left
        assert scan_once(settings=_settings(tmp), repo_root=REPO, stats=stats) == 0


def test_unrunnable_goes_to_failed() -> None:
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        (tmp / "inbox").mkdir()
        (tmp / "inbox" / "b.png").write_bytes(b"x")
        stats = LoopStats()
        s = _settings(tmp, detectors=("corrosion",))  # no weight env → SystemExit inside
        scan_once(settings=s, repo_root=REPO, stats=stats)
        assert (tmp / "inbox" / "failed" / "b.png").is_file()
        assert not (tmp / "bus" / "vp.detect.v1.jsonl").exists()
        assert (stats.processed, stats.failed) == (0, 1)
