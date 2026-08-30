import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBookId, getNativeChapterTitle, isReaderPage } from "../src/platform/weread.ts";
import { shouldUseNativeDark } from "../src/platform/native-reader.ts";
import { DEFAULT_SETTINGS } from "../src/core/settings.ts";

describe("WeRead routing", () => {
  it("recognizes reader routes and extracts the book id", () => {
    assert.equal(isReaderPage("/web/reader/abc123"), true);
    assert.equal(getBookId("/web/reader/abc123?chapter=2"), "abc123");
  });

  it("ignores shelf and category pages", () => {
    assert.equal(isReaderPage("/web/shelf"), false);
    assert.equal(getBookId("/web/category/all"), null);
  });
});

describe("WeRead chapter title", () => {
  it("falls back to the native top-bar chapter title for canvas-rendered chapters", () => {
    const root = {
      querySelector(selector: string) {
        if (selector !== ".readerTopBar_title_chapter") return null;
        return { textContent: "  第二节 外部性与规模经济  " };
      },
    } as unknown as ParentNode;

    assert.equal(getNativeChapterTitle(root), "第二节 外部性与规模经济");
  });
});

describe("WeRead native theme bridge", () => {
  it("maps BetterRead themes to the matching native canvas mode", () => {
    assert.equal(shouldUseNativeDark({ ...DEFAULT_SETTINGS, theme: "dark" }, false), true);
    assert.equal(shouldUseNativeDark({ ...DEFAULT_SETTINGS, theme: "midnight" }, false), true);
    assert.equal(shouldUseNativeDark({ ...DEFAULT_SETTINGS, theme: "parchment" }, true), false);
    assert.equal(shouldUseNativeDark({ ...DEFAULT_SETTINGS, theme: "paper" }, true), false);
    assert.equal(shouldUseNativeDark({ ...DEFAULT_SETTINGS, theme: "system" }, true), true);
    assert.equal(shouldUseNativeDark({ ...DEFAULT_SETTINGS, theme: "custom", customBackground: "#111111" }, false), true);
  });
});
