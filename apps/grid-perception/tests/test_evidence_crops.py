"""P0-T403: crop upload attaches evidence_object_id (mock HTTP, no GPU)."""

from __future__ import annotations

import base64
import json
import sys
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from grid_perception.evidence_crops import attach_crops, crop_bytes  # noqa: E402

PNG_1PX = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


class _Handler(BaseHTTPRequestHandler):
    last_body: dict | None = None

    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        _Handler.last_body = json.loads(raw.decode("utf-8"))
        self.send_response(201)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"id":"ev_testcrop01"}')

    def log_message(self, *_args: object) -> None:
        return


class EvidenceCropsTests(unittest.TestCase):
    def test_attach_crops_sets_evidence_id(self) -> None:
        img = Path(__file__).resolve().parent / "_fixture_crop.png"
        img.write_bytes(PNG_1PX)
        server = HTTPServer(("127.0.0.1", 0), _Handler)
        port = server.server_address[1]
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            out = attach_crops(
                source=img,
                detections_raw=[
                    {
                        "label": "corrosion",
                        "confidence": 0.9,
                        "bbox": [0.0, 0.0, 1.0, 1.0],
                    }
                ],
                label_map={"corrosion": "corrosion"},
                utility_id="util-demo-01",
                inspection_id="insp-1",
                asset_id=None,
                api_base=f"http://127.0.0.1:{port}/api/v1",
                api_key="dev-operator",
            )
        finally:
            server.shutdown()
            img.unlink(missing_ok=True)
        self.assertEqual(out[0]["evidence_object_id"], "ev_testcrop01")
        self.assertIsNotNone(_Handler.last_body)
        assert _Handler.last_body is not None
        self.assertEqual(_Handler.last_body["kind"], "crop")
        self.assertEqual(_Handler.last_body["class_id"], "corrosion")
        self.assertTrue(_Handler.last_body["data_base64"])

    def test_crop_bytes_returns_payload(self) -> None:
        img = Path(__file__).resolve().parent / "_fixture_crop2.png"
        img.write_bytes(PNG_1PX)
        blob, ctype = crop_bytes(img, [0.0, 0.0, 1.0, 1.0])
        img.unlink(missing_ok=True)
        self.assertGreater(len(blob), 0)
        self.assertTrue(ctype.startswith("image/"))


if __name__ == "__main__":
    unittest.main()
