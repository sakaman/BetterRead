import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { DEFAULT_SETTINGS } from "../src/core/settings.ts";
import {
  deleteBookProfile,
  hasBookProfile,
  loadResolvedSettings,
  saveBookProfile,
  saveGlobalSettings,
} from "../src/core/storage.ts";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
  configurable: true,
});

describe("settings storage", () => {
  beforeEach(() => localStorage.clear());

  it("falls back to the global profile", () => {
    const global = { ...DEFAULT_SETTINGS, theme: "sepia" as const };
    saveGlobalSettings(global);
    assert.equal(loadResolvedSettings("book-a").theme, "sepia");
  });

  it("supports independent per-book profiles", () => {
    saveGlobalSettings(DEFAULT_SETTINGS);
    saveBookProfile("book-a", { ...DEFAULT_SETTINGS, theme: "dark" });
    assert.equal(hasBookProfile("book-a"), true);
    assert.equal(loadResolvedSettings("book-a").theme, "dark");
    assert.equal(loadResolvedSettings("book-b").theme, "paper");
    deleteBookProfile("book-a");
    assert.equal(hasBookProfile("book-a"), false);
  });
});
