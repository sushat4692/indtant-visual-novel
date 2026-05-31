import type { CommandDef } from "../types";

/**
 * `-> <text> : <sceneId>` — one choice option.
 *
 * The parser merges consecutive `choice` commands into a single menu, so this
 * definition only needs to parse one option into a one-option choice command.
 */
export const choiceCommand: CommandDef = {
  name: "choice",
  match: (line) => line.startsWith("->"),
  parse: (line, lineNumber) => {
    const rest = line.slice(2).trim();
    const sep = rest.lastIndexOf(":");
    if (sep === -1) {
      throw new Error('選択肢は "-> テキスト : シーンID" の形式です (例: -> 告白する : confess)');
    }
    const text = rest.slice(0, sep).trim();
    const goto = rest.slice(sep + 1).trim();
    if (!text) throw new Error("選択肢のテキストが空です");
    if (!goto) throw new Error("選択肢の遷移先シーンIDが空です");
    return { kind: "choice", line: lineNumber, options: [{ text, goto }] };
  },
};
