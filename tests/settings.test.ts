import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/core/settings.ts";

describe("normalizeSettings", () => {
  it("returns safe defaults for missing data", () => {
    assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
  });

  it("preserves valid values and clamps unsafe ranges", () => {
    const settings = normalizeSettings({
      theme: "dark",
      accent: "#123abc",
      typography: {
        font: "lxgw",
        fontSize: 99,
        lineHeight: 0.5,
        letterSpacing: 0.06,
        paragraphSpacing: 1.4,
        contentWidth: 900,
        textAlign: "left",
      },
    });

    assert.equal(settings.theme, "dark");
    assert.equal(settings.accent, "#123abc");
    assert.equal(settings.typography.font, "lxgw");
    assert.equal(settings.typography.fontSize, 30);
    assert.equal(settings.typography.lineHeight, 1.4);
    assert.equal(settings.typography.contentWidth, 900);
  });

  it("rejects malformed theme and color values", () => {
    const settings = normalizeSettings({ theme: "unknown", accent: "red" });
    assert.equal(settings.theme, DEFAULT_SETTINGS.theme);
    assert.equal(settings.accent, DEFAULT_SETTINGS.accent);
  });
});
