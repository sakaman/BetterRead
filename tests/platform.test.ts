import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBookId, isReaderPage } from "../src/platform/weread.ts";

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
