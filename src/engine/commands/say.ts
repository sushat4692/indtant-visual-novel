import type { CommandDef } from "../types";

/**
 * Dialogue / narration. This is the fallback command, matched last.
 *
 * - `speakerKey: text` — a character line.
 * - `: text` or `narration: text` — narration (no speaker).
 *
 * The speaker key must not contain spaces, so lines like `bg classroom` are not
 * mistaken for dialogue (they are matched by their own commands first anyway).
 */
export const sayCommand: CommandDef = {
  name: "say",
  // Matches anything containing a colon, or a leading colon for narration.
  match: (line) => line.startsWith(":") || /^[^\s:]+\s*:/.test(line),
  parse: (line, lineNumber) => {
    const sep = line.indexOf(":");
    const rawSpeaker = line.slice(0, sep).trim();
    const text = line.slice(sep + 1).trim();
    const speaker = rawSpeaker === "" || rawSpeaker === "narration" ? null : rawSpeaker;
    return { kind: "say", line: lineNumber, speaker, text };
  },
};
