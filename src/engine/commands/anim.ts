import type { CommandDef } from "../types";

// `anim <char> <animationName>` — play a one-shot animation on a visible character.
export const animCommand: CommandDef = {
  name: "anim",
  match: (line) => /^anim\s+/.test(line),
  parse: (line, lineNumber) => {
    const parts = line.slice(4).trim().split(/\s+/);
    const [char, anim] = parts;
    if (!char || !anim) {
      throw new Error('anim コマンドの形式は "anim <キャラ> <アニメ>" です (例: anim taro shake)');
    }
    return { kind: "anim", line: lineNumber, char, anim };
  },
};
