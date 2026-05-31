import { describe, it, expect } from "vitest";
import { parseScene } from "./parser";

describe("parseScene", () => {
  it("parses background, show and dialogue", () => {
    const result = parseScene(`
bg bg_classroom
show taro left
太郎: やあ、花子。
: 二人は見つめ合った。
`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands).toEqual([
      { kind: "bg", line: 2, asset: "bg_classroom" },
      { kind: "show", line: 3, char: "taro", at: "left" },
      { kind: "say", line: 4, speaker: "太郎", text: "やあ、花子。" },
      { kind: "say", line: 5, speaker: null, text: "二人は見つめ合った。" },
    ]);
  });

  it("ignores comments and blank lines", () => {
    const result = parseScene(`# heading\n\nbg bg_room # trailing\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands).toEqual([{ kind: "bg", line: 3, asset: "bg_room" }]);
  });

  it("merges consecutive choices into one menu", () => {
    const result = parseScene(`-> 告白する : confess\n-> ごまかす : dodge\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0]).toEqual({
      kind: "choice",
      line: 1,
      options: [
        { text: "告白する", goto: "confess" },
        { text: "ごまかす", goto: "dodge" },
      ],
    });
  });

  it("parses effects, jump and end", () => {
    const result = parseScene(`@shake\njump next\nend\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands.map((c) => c.kind)).toEqual(["effect", "jump", "end"]);
  });

  it("reports an error for an invalid choice", () => {
    const result = parseScene(`-> 行き先なし\n`);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].line).toBe(1);
  });

  it("reports an error for an unparseable line", () => {
    const result = parseScene(`!!!??? broken`);
    expect(result.ok).toBe(false);
  });

  it("parses bgm with asset and bgm off as null", () => {
    const result = parseScene(`bgm bgm_calm\nbgm off\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands).toEqual([
      { kind: "bgm", line: 1, asset: "bgm_calm" },
      { kind: "bgm", line: 2, asset: null },
    ]);
  });

  it("parses se", () => {
    const result = parseScene(`se se_door\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands[0]).toEqual({ kind: "se", line: 1, asset: "se_door" });
  });

  it("parses end with and without text", () => {
    const result = parseScene(`end おしまい\nend\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands).toEqual([
      { kind: "end", line: 1, text: "おしまい" },
      { kind: "end", line: 2, text: undefined },
    ]);
  });

  it("parses jump with transition and speed", () => {
    const result = parseScene(`jump s2 fade slow\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands[0]).toEqual({
      kind: "jump",
      line: 1,
      target: "s2",
      transition: "fade",
      speed: "slow",
    });
  });

  it("parses jump without transition (omitted)", () => {
    const result = parseScene(`jump s2\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands[0]).toEqual({
      kind: "jump",
      line: 1,
      target: "s2",
      transition: undefined,
      speed: undefined,
    });
  });

  it("parses a choice with transition and speed", () => {
    const result = parseScene(`-> 行く : s2 fade fast\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands[0]).toEqual({
      kind: "choice",
      line: 1,
      options: [{ text: "行く", goto: "s2", transition: "fade", speed: "fast" }],
    });
  });

  it("parses anim command", () => {
    const result = parseScene(`anim taro shake\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands[0]).toEqual({ kind: "anim", line: 1, char: "taro", anim: "shake" });
  });

  it("reports an error for anim missing the animation name", () => {
    const result = parseScene(`anim taro\n`);
    expect(result.ok).toBe(false);
  });

  it("keeps rich-text markup verbatim in say text", () => {
    const result = parseScene(`太郎: {red}重要{/}だ\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.commands[0]).toEqual({
      kind: "say",
      line: 1,
      speaker: "太郎",
      text: "{red}重要{/}だ",
    });
  });
});
