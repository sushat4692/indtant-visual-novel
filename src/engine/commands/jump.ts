import type { CommandDef } from "../types";

// `jump <sceneId>` — unconditionally continue at another scene.
export const jumpCommand: CommandDef = {
  name: "jump",
  match: (line) => /^jump\s+/.test(line),
  parse: (line, lineNumber) => {
    const target = line.slice(4).trim();
    if (!target) throw new Error("jump コマンドには遷移先のシーンIDが必要です (例: jump confess)");
    return { kind: "jump", line: lineNumber, target };
  },
};
