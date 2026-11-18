#!/usr/bin/env python3
"""Seed pulse-api evidence with procedural defect crops (no real imagery needed).

Env (no hardcoded hosts): PULSE_API_URL (default http://127.0.0.1:3000/api/v1),
PULSE_API_KEY, PULSE_SEED_UTILITY (default util-demo-01).
Needs Pillow. Usage: PULSE_API_KEY=dev-operator python3 scripts/seed-evidence.py
"""
import base64
import io
import json
import math
import os
import random
import urllib.request

from PIL import Image, ImageDraw, ImageFilter

API = os.environ.get("PULSE_API_URL", "http://127.0.0.1:3000/api/v1").rstrip("/")
KEY = os.environ.get("PULSE_API_KEY", "")
UTILITY = os.environ.get("PULSE_SEED_UTILITY", "util-demo-01")
W, H = 320, 240


def noise(rng, base, spread):
    img = Image.new("RGB", (W, H), base)
    px = img.load()
    for y in range(H):
        for x in range(W):
            n = rng.randint(-spread, spread)
            r, g, b = px[x, y]
            px[x, y] = (max(0, r + n), max(0, g + n), max(0, b + n))
    return img.filter(ImageFilter.GaussianBlur(0.8))


def corrosion(rng):
    img = noise(rng, (92, 88, 84), 18)
    d = ImageDraw.Draw(img, "RGBA")
    for _ in range(46):
        x, y, r = rng.randint(30, W - 30), rng.randint(20, H - 20), rng.randint(8, 34)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(176 + rng.randint(-20, 20), 84, 28, rng.randint(60, 140)))
    return img.filter(ImageFilter.GaussianBlur(1.2))


def crack(rng):
    img = noise(rng, (140, 144, 146), 14)
    d = ImageDraw.Draw(img)
    x, y = rng.randint(20, 80), rng.randint(40, H - 40)
    for _ in range(26):
        nx, ny = x + rng.randint(6, 18), y + rng.randint(-16, 16)
        d.line((x, y, nx, ny), fill=(24, 24, 28), width=rng.randint(1, 3))
        if rng.random() < 0.25:
            d.line((nx, ny, nx + rng.randint(4, 14), ny + rng.randint(-20, 20)), fill=(30, 30, 34), width=1)
        x, y = nx, ny
    return img


def vegetation(rng):
    img = Image.new("RGB", (W, H), (96, 140, 190))
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle((0, int(H * 0.62), W, H), fill=(34, 74, 40))
    for _ in range(260):
        x, y = rng.randint(0, W), rng.randint(int(H * 0.3), H)
        r = rng.randint(6, 22)
        d.ellipse((x - r, y - r, x + r, y + r), fill=(30 + rng.randint(0, 40), 100 + rng.randint(0, 80), 36, 150))
    d.line((W // 2 - 40, 0, W // 2 - 30, int(H * 0.7)), fill=(40, 40, 46), width=3)
    return img.filter(ImageFilter.GaussianBlur(0.6))


def thermal(rng):
    img = Image.new("RGB", (W, H))
    px = img.load()
    cx, cy = rng.randint(120, 200), rng.randint(90, 150)
    for y in range(H):
        for x in range(W):
            t = max(0.0, 1 - math.hypot(x - cx, y - cy) / 120) + rng.random() * 0.03
            px[x, y] = (int(min(255, 40 + 520 * t)), int(min(255, 20 + 360 * t * t)), int(max(0, 90 - 90 * t + 40 * (1 - t))))
    return img.filter(ImageFilter.GaussianBlur(1.5))


def sag(rng):
    img = Image.new("RGB", (W, H), (176, 204, 220))
    d = ImageDraw.Draw(img)
    pts = [(x, 60 + 90 * math.sin(math.pi * x / W) ** 2 * 0.9) for x in range(0, W + 1, 8)]
    d.line(pts, fill=(26, 34, 40), width=3)
    d.line((18, 0, 18, H), fill=(60, 66, 72), width=6)
    d.line((W - 18, 0, W - 18, H), fill=(60, 66, 72), width=6)
    return img


MAKERS = {"corrosion": corrosion, "crack": crack, "vegetation": vegetation, "thermal_hotspot": thermal, "sag": sag}

# (inspection, class, confidence, label, asset)
SEED = [
    ("insp-02", "corrosion", 0.94, "Flange corrosion · T-117", "ast-tower-01"),
    ("insp-02", "thermal_hotspot", 0.91, "Joint hotspot · bay 3", "ast-line-01"),
    ("insp-02", "crack", 0.83, "Insulator crack · phase B", "ast-tower-01"),
    ("insp-06", "vegetation", 0.88, "Encroachment · span 204", "ast-span-01"),
    ("insp-06", "sag", 0.79, "Conductor sag · span 204", "ast-span-01"),
    ("insp-06", "corrosion", 0.86, "Lattice corrosion · T-204", "ast-span-01"),
    ("insp-03", "crack", 0.92, "Bushing crack · bay 2", "ast-sub-01"),
    ("insp-03", "thermal_hotspot", 0.97, "Bushing hotspot · bay 2", "ast-sub-01"),
    ("insp-05", "vegetation", 0.74, "Feeder canopy contact", "ast-feeder-01"),
]


def post(body):
    req = urllib.request.Request(
        f"{API}/evidence",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", **({"X-API-Key": KEY} if KEY else {})},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["id"]


def main():
    for i, (insp, cls, conf, label, asset) in enumerate(SEED):
        rng = random.Random(f"{insp}/{cls}/{i}")
        img = MAKERS[cls](rng)
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=88)
        bx, by = rng.randint(400, 2400), rng.randint(300, 1500)
        ev_id = post({
            "utility_id": UTILITY,
            "inspection_id": insp,
            "asset_id": asset,
            "kind": "crop",
            "content_type": "image/jpeg",
            "data_base64": base64.b64encode(buf.getvalue()).decode(),
            "class_id": cls,
            "confidence": conf,
            "bbox": [bx, by, W, H],
            "label": label,
            "captured_at": f"2026-11-18T0{5 + i % 3}:{10 + i * 4:02d}:00Z",
        })
        print(f"{ev_id}  {insp}  {cls:<16} {conf:.2f}  {buf.tell() // 1024} KB")


if __name__ == "__main__":
    main()
