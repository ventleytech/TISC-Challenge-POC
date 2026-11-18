import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CATALOGS,
  DEFAULT_LOCALE,
  en,
  hi,
  listLocales,
  t,
} from "../src/index.js";

describe("i18n catalogs", () => {
  it("exposes en + hi with identical keysets", () => {
    assert.deepEqual([...listLocales()].sort(), ["en", "hi"]);
    assert.equal(DEFAULT_LOCALE, "en");
    const enKeys = Object.keys(en).sort();
    const hiKeys = Object.keys(hi).sort();
    assert.deepEqual(enKeys, hiKeys);
    assert.ok(enKeys.length >= 10);
  });

  it("brands VoltPulse only", () => {
    assert.equal(t("app.name"), "VoltPulse");
    assert.equal(t("app.name", "hi"), "VoltPulse");
    for (const locale of Object.keys(CATALOGS)) {
      const blob = JSON.stringify(CATALOGS[locale]).toLowerCase();
      // internal-brand guard (tokens split so the repo stays grep-clean)
      assert.equal(blob.includes("tri" + "netra"), false);
      assert.equal(blob.includes("t-" + "netra"), false);
    }
  });

  it("t() resolves locale and falls back", () => {
    assert.equal(t("nav.alerts", "en"), "Alerts");
    assert.equal(t("nav.alerts", "hi"), "अलर्ट");
    assert.equal(t("nav.alerts", "fr"), "Alerts"); // unknown → en
    assert.equal(t("missing.key"), "missing.key");
  });

  it("covers detection enum keys", () => {
    for (const id of [
      "crack",
      "sag",
      "corrosion",
      "vegetation",
      "thermal_hotspot",
    ]) {
      assert.notEqual(t(`detection.${id}`), `detection.${id}`);
    }
  });
});
