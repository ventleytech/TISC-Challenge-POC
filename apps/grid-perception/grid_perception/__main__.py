"""CLI: file/dir ingest → vp.detect.v1 JSON."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from grid_perception.config import load_settings
from grid_perception.emit import assert_detect_shape, build_detect_event
from grid_perception.infer import run_detectors


def _repo_root() -> Path:
    # apps/grid-perception/grid_perception/__main__.py → repo root = parents[3]
    return Path(__file__).resolve().parents[3]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="grid_perception",
        description="VoltPulse file-ingest stub → vp.detect.v1 JSON",
    )
    parser.add_argument(
        "--source",
        help="Image file or directory (overrides GP_SOURCE)",
    )
    parser.add_argument(
        "--detectors",
        default="corrosion",
        help="Comma list: corrosion,crack,vegetation,sag,thermal_hotspot",
    )
    parser.add_argument("--out", help="Write JSON to this path (else stdout)")
    parser.add_argument("--inspection-id", default=None)
    parser.add_argument("--asset-id", default=None)
    parser.add_argument(
        "--ingest-source",
        default="upload",
        choices=["live", "upload", "thermal_media"],
    )
    parser.add_argument(
        "--fallback-sentinel",
        action="store_true",
        help="Emit optional ≤0.01 conf row for sag/thermal fallbacks (plumbing only)",
    )
    args = parser.parse_args(argv)

    root = _repo_root()
    settings = load_settings(repo_root=root)
    if args.fallback_sentinel:
        # frozen dataclass — rebuild with sentinel on
        from dataclasses import replace

        settings = replace(settings, fallback_sentinel=True)

    source_raw = args.source or settings.source
    if not source_raw:
        parser.error("--source or GP_SOURCE required")
    source = Path(source_raw)
    if not source.is_absolute():
        # CLI relative → cwd first; env-style paths often repo-root relative
        cwd_cand = (Path.cwd() / source).resolve()
        root_cand = (root / source).resolve()
        if cwd_cand.exists():
            source = cwd_cand
        elif root_cand.exists():
            source = root_cand
        else:
            source = cwd_cand
    if not source.exists():
        print(f"source not found: {source}", file=sys.stderr)
        return 2

    detectors = [d.strip() for d in args.detectors.split(",") if d.strip()]
    raw, fallback_reasons = run_detectors(
        settings=settings,
        source=source,
        detectors=detectors,
        repo_root=root,
    )
    event = build_detect_event(
        detections_raw=raw,
        label_map=settings.label_map,
        inspection_id=args.inspection_id,
        asset_id=args.asset_id,
        source=args.ingest_source,
        fallback_reasons=fallback_reasons or None,
    )
    assert_detect_shape(event)

    payload = json.dumps(event, indent=2)
    if args.out:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(payload + "\n", encoding="utf-8")
        print(
            f"wrote {out_path} detections={len(event['detections'])} "
            f"fallbacks={len(event.get('fallback_reasons') or [])} "
            f"topic={settings.detect_topic}",
            file=sys.stderr,
        )
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
