import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { READER_CSS } from "../src/styles/reader-css.ts";

describe("reader navigation visibility", () => {
  it("keeps the next-chapter footer interactive while immersive chrome is hidden", () => {
    const immersiveRule = READER_CSS.match(
      /html\[data-br-enabled="true"\]\[data-br-focus="true"\]\[data-br-focus-hidden="true"\][\s\S]*?\{([\s\S]*?)\}/,
    );

    assert.ok(immersiveRule, "immersive hiding rule should exist");
    const selectors = immersiveRule[0].slice(0, immersiveRule[0].indexOf("{"));
    assert.doesNotMatch(selectors, /readerFooter/);
  });
});
