import type { CommandDef } from "../types";

// `end` or `end <text>` — terminate playback with an optional ending message.
export const endCommand: CommandDef = {
  name: "end",
  match: (line) => line === "end" || line.startsWith("end "),
  parse: (line, lineNumber) => {
    const text = line.slice(3).trim() || undefined;
    return { kind: "end", line: lineNumber, text };
  },
};
