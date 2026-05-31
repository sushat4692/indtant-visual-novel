import type { CommandDef } from "../types";

// `wait <ms>` — pause for a number of milliseconds.
export const waitCommand: CommandDef = {
  name: "wait",
  match: (line) => /^wait\s+/.test(line),
  parse: (line, lineNumber) => {
    const raw = line.slice(4).trim();
    const ms = Number(raw);
    if (!Number.isFinite(ms) || ms < 0) {
      throw new Error(`wait コマンドには 0 以上の数値(ms)が必要です: "${raw}"`);
    }
    return { kind: "wait", line: lineNumber, ms };
  },
};
