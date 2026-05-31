import { describe, it, expect } from "vitest";
import { parseRichText } from "./richText";

describe("parseRichText", () => {
  it("returns a single plain segment for unstyled text", () => {
    expect(parseRichText("こんにちは")).toEqual([{ text: "こんにちは" }]);
  });

  it("returns a single plain segment for empty input", () => {
    expect(parseRichText("")).toEqual([{ text: "" }]);
  });

  it("applies a named color", () => {
    expect(parseRichText("{red}重要{/}")).toEqual([{ text: "重要", color: "#ef4444" }]);
  });

  it("applies multiple rules in one tag", () => {
    expect(parseRichText("{red,big}x{/}")).toEqual([{ text: "x", color: "#ef4444", em: 1.3 }]);
  });

  it("applies a hex color", () => {
    expect(parseRichText("{#ff8800}x{/}")).toEqual([{ text: "x", color: "#ff8800" }]);
  });

  it("maps big and small to em multipliers", () => {
    expect(parseRichText("{big}x{/}")).toEqual([{ text: "x", em: 1.3 }]);
    expect(parseRichText("{small}x{/}")).toEqual([{ text: "x", em: 0.75 }]);
  });

  it("keeps surrounding plain text as separate segments", () => {
    expect(parseRichText("あ{red}い{/}う")).toEqual([
      { text: "あ" },
      { text: "い", color: "#ef4444" },
      { text: "う" },
    ]);
  });

  it("handles adjacent tags", () => {
    expect(parseRichText("{red}あ{/}{blue}い{/}")).toEqual([
      { text: "あ", color: "#ef4444" },
      { text: "い", color: "#60a5fa" },
    ]);
  });

  it("ignores unknown rules but keeps the text", () => {
    expect(parseRichText("{unknown}x{/}")).toEqual([{ text: "x" }]);
  });
});
