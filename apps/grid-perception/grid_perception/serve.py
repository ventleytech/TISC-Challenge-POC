"""Container entrypoint: /health + inbox watcher (file ingest → detect.v1 JSONL bus)."""

from __future__ import annotations

import json
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from grid_perception.config import load_settings
from grid_perception.loop import LoopStats, run_forever


def main() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    settings = load_settings(repo_root=repo_root)
    port = int(os.environ.get("GP_HEALTH_PORT", "8081"))
    stats = LoopStats()
    stop = threading.Event()

    loop_on = bool(settings.inbox_dir and settings.detect_file)
    if loop_on:
        Path(settings.inbox_dir).mkdir(parents=True, exist_ok=True)
        threading.Thread(
            target=run_forever,
            kwargs={"settings": settings, "repo_root": repo_root, "stats": stats, "stop": stop},
            daemon=True,
        ).start()
        print(
            f"ingest loop inbox={settings.inbox_dir} bus={settings.detect_file} "
            f"detectors={','.join(settings.detectors)} poll_ms={settings.poll_ms}",
            flush=True,
        )
    else:
        print("ingest loop off (set GP_INBOX_DIR and GP_DETECT_FILE)", file=sys.stderr, flush=True)

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            path = self.path.split("?", 1)[0]
            if path == "/metrics":
                with stats.lock:
                    text = (
                        "# HELP vp_up VoltPulse process up\n"
                        "# TYPE vp_up gauge\n"
                        'vp_up{service="grid-perception",plane="sense"} 1\n'
                        "# HELP vp_perception_processed_total Inbox files processed\n"
                        "# TYPE vp_perception_processed_total counter\n"
                        f"vp_perception_processed_total {stats.processed}\n"
                        "# HELP vp_perception_detections_total Detections emitted\n"
                        "# TYPE vp_perception_detections_total counter\n"
                        f"vp_perception_detections_total {stats.detections}\n"
                    )
                body = text.encode()
                self.send_response(200)
                self.send_header(
                    "content-type", "text/plain; version=0.0.4; charset=utf-8"
                )
                self.end_headers()
                self.wfile.write(body)
                return
            if path != "/health":
                self.send_error(404)
                return
            with stats.lock:
                body = json.dumps(
                    {
                        "status": "ok",
                        "service": "grid-perception",
                        "detect_topic": settings.detect_topic,
                        "ingest_loop": loop_on,
                        "detectors": list(settings.detectors),
                        "processed": stats.processed,
                        "failed": stats.failed,
                        "detections": stats.detections,
                    }
                ).encode()
            self.send_response(200)
            self.send_header("content-type", "application/json")
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_args: object) -> None:
            return

    print(f"grid-perception health on :{port}", flush=True)
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
