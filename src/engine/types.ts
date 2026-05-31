// Core domain & engine types for the visual novel platform.

/** Character position on the stage. */
export type Position = "left" | "center" | "right";

/** A character definition (lives in project meta). */
export interface CharacterDef {
  /** Display name shown in the text box. */
  name: string;
  /** Asset id used for the character sprite (builtin or uploaded). */
  sprite: string;
}

/** A single virtual scene file (a chunk of DSL script). */
export interface Scene {
  id: string;
  /** Human friendly name shown in the scene list. */
  name: string;
  /** Raw DSL source for this scene. */
  script: string;
}

/** Project metadata. */
export interface ProjectMeta {
  title: string;
  /** Scene id where playback starts. */
  startScene: string;
  /** speakerKey -> character definition. */
  characters: Record<string, CharacterDef>;
}

/** A full authored project. */
export interface Project {
  id: string;
  name: string;
  updatedAt: number;
  meta: ProjectMeta;
  /** sceneId -> Scene. */
  scenes: Record<string, Scene>;
  /** Ids of uploaded assets this project references. */
  uploadedAssetIds: string[];
  /**
   * When true the project was imported from a play-only (encrypted) bundle and
   * must not be opened in the editor.
   */
  locked?: boolean;
}

// ---------------------------------------------------------------------------
// Parsed commands
// ---------------------------------------------------------------------------

/** One choice option in a choice menu. */
export interface ChoiceOption {
  text: string;
  /** Target scene id to jump to when selected. */
  goto: string;
}

/**
 * A parsed command. `kind` discriminates the variant. New commands are added by
 * registering a new definition in engine/commands and extending this union.
 */
export type Command =
  | { kind: "bg"; line: number; asset: string }
  | { kind: "show"; line: number; char: string; at: Position }
  | { kind: "hide"; line: number; char: string }
  | { kind: "say"; line: number; speaker: string | null; text: string }
  | { kind: "effect"; line: number; effect: string }
  | { kind: "bgm"; line: number; asset: string }
  | { kind: "se"; line: number; asset: string }
  | { kind: "wait"; line: number; ms: number }
  | { kind: "choice"; line: number; options: ChoiceOption[] }
  | { kind: "jump"; line: number; target: string }
  | { kind: "end"; line: number };

export type CommandKind = Command["kind"];

/** A parse error with 1-based line number (within a scene). */
export interface ParseError {
  scene?: string;
  line: number;
  message: string;
}

export type ParseResult =
  | { ok: true; commands: Command[] }
  | { ok: false; errors: ParseError[] };

// ---------------------------------------------------------------------------
// Command registry contract
// ---------------------------------------------------------------------------

/**
 * A command definition. Adding a new expression to the DSL is as simple as
 * implementing this interface and registering it in commands/index.ts.
 */
export interface CommandDef {
  /** Stable name (for debugging / docs). */
  name: string;
  /**
   * Decide whether this definition handles the given (trimmed, non-comment)
   * line. Definitions are tried in registration order; the first match wins.
   */
  match(line: string): boolean;
  /**
   * Parse a single line into a Command. Throw an Error with a human readable
   * message to report a parse error for this line.
   */
  parse(line: string, lineNumber: number): Command;
}
