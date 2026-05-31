import type { CommandDef } from "../types";

// `end` — terminate playback.
export const endCommand: CommandDef = {
  name: "end",
  match: (line) => line === "end",
  parse: (_line, lineNumber) => ({ kind: "end", line: lineNumber }),
};
