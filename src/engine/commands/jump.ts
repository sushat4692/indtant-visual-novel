import type { CommandDef } from "../types";

// `jump <sceneId> [transition]` — unconditionally continue at another scene.
// Optional transition: fade | white
export const jumpCommand: CommandDef = {
  name: "jump",
  match: (line) => /^jump\s+/.test(line),
  parse: (line, lineNumber) => {
    const parts = line.slice(4).trim().split(/\s+/);
    const [target, transition] = parts;
    if (!target) throw new Error("jump コマンドには遷移先のシーンIDが必要です (例: jump confess)");
    return { kind: "jump", line: lineNumber, target, transition: transition || undefined };
  },
};
