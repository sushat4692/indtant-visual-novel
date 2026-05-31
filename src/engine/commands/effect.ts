import type { CommandDef } from "../types";

/** Effects supported by StageView's CSS animations. */
export const KNOWN_EFFECTS = ["shake", "flash", "fade", "fadeout"];

// `@<effect>` — trigger a screen effect.
export const effectCommand: CommandDef = {
  name: "effect",
  match: (line) => line.startsWith("@"),
  parse: (line, lineNumber) => {
    const effect = line.slice(1).trim();
    if (!effect) throw new Error("エフェクト名が必要です (例: @shake)");
    return { kind: "effect", line: lineNumber, effect };
  },
};
