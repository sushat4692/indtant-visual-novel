import type { CommandDef } from "../types";

// `bgm <assetId>` — set background music. `bgm off` stops playback.
export const bgmCommand: CommandDef = {
  name: "bgm",
  match: (line) => /^bgm(\s|$)/.test(line),
  parse: (line, lineNumber) => {
    const asset = line.slice(3).trim();
    if (!asset) throw new Error("bgm コマンドには音声アセットIDまたは off が必要です (例: bgm bgm_calm)");
    return { kind: "bgm", line: lineNumber, asset: asset === "off" ? null : asset };
  },
};

// `se <assetId>` — play a sound effect.
export const seCommand: CommandDef = {
  name: "se",
  match: (line) => /^se\s+/.test(line),
  parse: (line, lineNumber) => {
    const asset = line.slice(2).trim();
    if (!asset) throw new Error("se コマンドには音声アセットIDが必要です (例: se se_door)");
    return { kind: "se", line: lineNumber, asset };
  },
};
