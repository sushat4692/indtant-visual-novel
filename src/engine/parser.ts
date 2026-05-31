import type { Command, ParseError, ParseResult } from "./types";
import { COMMAND_REGISTRY } from "./commands";

/** Strip a trailing `# comment`, respecting nothing fancy (no escaping). */
function stripComment(line: string): string {
  const hash = line.indexOf("#");
  return hash === -1 ? line : line.slice(0, hash);
}

/**
 * Parse a single scene's DSL source into a list of commands.
 *
 * Consecutive `choice` commands are merged into a single choice menu so authors
 * can write one `-> ... : ...` per line.
 */
export function parseScene(script: string): ParseResult {
  const errors: ParseError[] = [];
  const commands: Command[] = [];
  const lines = script.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const raw = stripComment(lines[i]).trim();
    if (raw === "") continue;

    const def = COMMAND_REGISTRY.find((d) => d.match(raw));
    if (!def) {
      errors.push({ line: lineNumber, message: `解釈できない行です: "${raw}"` });
      continue;
    }

    try {
      const cmd = def.parse(raw, lineNumber);
      // Merge an adjacent choice option into the previous choice menu.
      const prev = commands[commands.length - 1];
      if (cmd.kind === "choice" && prev && prev.kind === "choice") {
        prev.options.push(...cmd.options);
      } else {
        commands.push(cmd);
      }
    } catch (err) {
      errors.push({
        line: lineNumber,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, commands };
}
