"""Inbox watcher: new image → detectors → one vp.detect.v1 JSON line on the file bus."""

from __future__ import annotations

import json
import shutil
import sys
import threading
from dataclasses import dataclass, field
from pathlib import Path

from grid_perception.config import Settings
from grid_perception.emit import assert_detect_shape, build_detect_event
from grid_perception.infer import run_detectors

IMAGE_SUFFIXES = frozenset({".jpg", ".jpeg", ".png", ".bmp", ".webp"})


@dataclass
class LoopStats:
    processed: int = 0
    failed: int = 0
    detections: int = 0
    lock: threading.Lock = field(default_factory=threading.Lock, repr=False)


def _move(path: Path, dest_dir: str) -> None:
    dest = path.parent / dest_dir
    dest.mkdir(exist_ok=True)
    shutil.move(str(path), str(dest / path.name))


def process_file(path: Path, *, settings: Settings, repo_root: Path) -> dict:
    """Run configured detectors on one image; append the event to settings.detect_file."""
    raw, reasons = run_detectors(
        settings=settings,
        source=path,
        detectors=list(settings.detectors),
        repo_root=repo_root,
    )
    event = build_detect_event(
        detections_raw=raw,
        label_map=settings.label_map,
        inspection_id=settings.inspection_id or None,
        asset_id=settings.asset_id or None,
        source=settings.ingest_source,
        fallback_reasons=reasons or None,
    )
    assert_detect_shape(event)
    out = Path(settings.detect_file)
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(event) + "\n")
    return event


def scan_once(*, settings: Settings, repo_root: Path, stats: LoopStats) -> int:
    """Process every image currently in inbox_dir (top level). Returns files handled."""
    inbox = Path(settings.inbox_dir)
    handled = 0
    for path in sorted(inbox.iterdir()) if inbox.is_dir() else []:
        if not path.is_file() or path.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        handled += 1
        try:
            event = process_file(path, settings=settings, repo_root=repo_root)
        # run_detectors / predict_source signal "nothing could run" via SystemExit.
        except (Exception, SystemExit) as exc:
            print(f"ingest failed {path.name}: {exc!r}", file=sys.stderr, flush=True)
            with stats.lock:
                stats.failed += 1
            _move(path, "failed")
            continue
        print(
            f"ingest ok {path.name} detections={len(event['detections'])} "
            f"event={event['event_id']}",
            flush=True,
        )
        with stats.lock:
            stats.processed += 1
            stats.detections += len(event["detections"])
        _move(path, "processed")
    return handled


def run_forever(*, settings: Settings, repo_root: Path, stats: LoopStats, stop: threading.Event) -> None:
    while not stop.is_set():
        try:
            scan_once(settings=settings, repo_root=repo_root, stats=stats)
        except OSError as exc:
            print(f"inbox scan error: {exc!r}", file=sys.stderr, flush=True)
        stop.wait(settings.poll_ms / 1000)
