"""CLI: python -m compliance_report <summary.json> <out.html>"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from compliance_report.render import write_report
from compliance_report.summary import SummaryValidationError, parse_summary


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="python -m compliance_report",
        description=(
            "VoltPulse W06 compliance report stub: "
            "inspection summary JSON → HTML toward PDF"
        ),
    )
    parser.add_argument(
        "summary_json",
        type=Path,
        help="Path to inspection summary JSON",
    )
    parser.add_argument(
        "output_html",
        type=Path,
        help="Output HTML path (stub toward PDF)",
    )
    args = parser.parse_args(argv)

    try:
        raw = json.loads(args.summary_json.read_text(encoding="utf-8"))
        summary = parse_summary(raw)
        path = write_report(summary, args.output_html)
    except (OSError, json.JSONDecodeError, SummaryValidationError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
