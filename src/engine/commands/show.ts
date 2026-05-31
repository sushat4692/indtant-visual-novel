import type { CommandDef, Position } from "../types";

const POSITIONS: Position[] = ["left", "center", "right"];

// `show <char> [left|center|right]` — show a character sprite.
export const showCommand: CommandDef = {
  name: "show",
  match: (line) => /^show\s+/.test(line),
  parse: (line, lineNumber) => {
    const rest = line.slice(4).trim();
    const parts = rest.split(/\s+/);
    const char = parts[0];
    if (!char) throw new Error("show コマンドにはキャラクターのキーが必要です (例: show taro left)");
    let at: Position = "center";
    if (parts[1]) {
      if (!POSITIONS.includes(parts[1] as Position)) {
        throw new Error(`位置は left / center / right のいずれかです: "${parts[1]}"`);
      }
      at = parts[1] as Position;
    }
    return { kind: "show", line: lineNumber, char, at };
  },
};

// `hide <char>` — hide a character sprite.
export const hideCommand: CommandDef = {
  name: "hide",
  match: (line) => /^hide\s+/.test(line),
  parse: (line, lineNumber) => {
    const char = line.slice(4).trim();
    if (!char) throw new Error("hide コマンドにはキャラクターのキーが必要です (例: hide taro)");
    return { kind: "hide", line: lineNumber, char };
  },
};
