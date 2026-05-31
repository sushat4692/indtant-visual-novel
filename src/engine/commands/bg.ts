import type { CommandDef } from "../types";

// `bg <assetId>` — change the background.
export const bgCommand: CommandDef = {
  name: "bg",
  match: (line) => /^bg\s+/.test(line),
  parse: (line, lineNumber) => {
    const asset = line.slice(2).trim();
    if (!asset) throw new Error("bg コマンドには背景アセットIDが必要です (例: bg bg_classroom)");
    return { kind: "bg", line: lineNumber, asset };
  },
};
