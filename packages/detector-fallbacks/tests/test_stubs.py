"""Smoke tests: stubs stay empty/honest — no fake accuracy."""

from __future__ import annotations

import unittest

from detector_fallbacks import (
    FALLBACK_CLASS_IDS,
    FALLBACK_REASONS,
    list_fallbacks,
    run_fallback,
)


class StubHonestyTests(unittest.TestCase):
    def test_fallback_ids_match_c04_remaining(self) -> None:
        self.assertEqual(FALLBACK_CLASS_IDS, frozenset({"sag", "thermal_hotspot"}))

    def test_default_empty_detections(self) -> None:
        for class_id in sorted(FALLBACK_CLASS_IDS):
            result = run_fallback(class_id)
            self.assertEqual(result["status"], "fallback")
            self.assertEqual(result["class_id"], class_id)
            self.assertEqual(result["detections"], [])
            self.assertEqual(result["confidence_ceiling"], 0.0)
            reason_l = result["fallback_reason"].lower()
            token = "sag" if class_id == "sag" else "thermal"
            self.assertIn(token, reason_l)
            self.assertGreater(len(result["fallback_reason"]), 20)

    def test_reasons_documented(self) -> None:
        reasons = list_fallbacks()
        self.assertEqual(set(reasons), set(FALLBACK_REASONS))
        for reason in reasons.values():
            for banned in ("tri" + "netra", "t-" + "netra"):  # internal-brand guard
                self.assertNotIn(banned, reason.lower())
            # no fake SOTA language
            for banned in ("SOTA", "99%", "mAP@0.5 =", "production-ready accuracy"):
                self.assertNotIn(banned, reason)

    def test_low_conf_sentinel_optional(self) -> None:
        result = run_fallback("sag", emit_low_conf_sentinel=True)
        self.assertEqual(len(result["detections"]), 1)
        self.assertEqual(result["detections"][0]["label"], "sag")
        self.assertLessEqual(result["detections"][0]["confidence"], 0.01)
        self.assertEqual(result["confidence_ceiling"], 0.01)

    def test_unknown_class_raises(self) -> None:
        with self.assertRaises(ValueError):
            run_fallback("corrosion")


if __name__ == "__main__":
    unittest.main()
