"""Container entrypoint (P0-T340 stub): load settings, serve /health.

Real inference loop (Kafka producer + weights) is a follow-up card.
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

from grid_perception.config import load_settings


def main() -> None:
    settings = load_settings()
    port = int(os.environ.get("GP_HEALTH_PORT", "8081"))
    body = json.dumps(
        {"status": "ok", "service": "grid-perception", "detect_topic": settings.detect_topic}
    ).encode()

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            if self.path != "/health":
                self.send_error(404)
                return
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
