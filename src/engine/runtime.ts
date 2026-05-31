import type { Command, ChoiceOption, Position, Project } from "./types";
import { parseScene } from "./parser";

/** A character currently visible on the stage. */
export interface VisibleChar {
  char: string;
  at: Position;
}

/** The current renderable state of the stage. */
export interface RuntimeState {
  background: string | null;
  bgm: string | null;
  characters: VisibleChar[];
  /** Last effect that fired (for one-shot CSS animations). */
  effect: string | null;
  /** Monotonic token so the view can re-trigger the same effect. */
  effectToken: number;
  speaker: string | null;
  text: string;
  /** Choice menu currently awaiting selection, or null. */
  choices: ChoiceOption[] | null;
  /** True once `end` was reached or the script ran out. */
  finished: boolean;
}

function emptyState(): RuntimeState {
  return {
    background: null,
    bgm: null,
    characters: [],
    effect: null,
    effectToken: 0,
    speaker: null,
    text: "",
    choices: null,
    finished: false,
  };
}

/**
 * A cross-scene visual novel interpreter.
 *
 * Each scene's script is parsed lazily on first visit. `next()` advances until
 * it produces something the player must see (a line) or interact with (a
 * choice), or until playback ends. `select()` resolves a pending choice.
 */
export class Runtime {
  private project: Project;
  private parsedScenes = new Map<string, Command[]>();
  private sceneId: string;
  private index = 0;
  state: RuntimeState;

  constructor(project: Project) {
    this.project = project;
    this.sceneId = project.meta.startScene;
    this.state = emptyState();
  }

  /** Resolve the display name for a speaker key (falls back to the key). */
  speakerName(key: string): string {
    return this.project.meta.characters[key]?.name ?? key;
  }

  private commandsFor(sceneId: string): Command[] {
    const cached = this.parsedScenes.get(sceneId);
    if (cached) return cached;
    const scene = this.project.scenes[sceneId];
    if (!scene) {
      // Treat a missing scene as an immediate end to avoid hard crashes.
      this.parsedScenes.set(sceneId, []);
      return [];
    }
    const result = parseScene(scene.script);
    const commands = result.ok ? result.commands : [];
    this.parsedScenes.set(sceneId, commands);
    return commands;
  }

  private gotoScene(sceneId: string) {
    this.sceneId = sceneId;
    this.index = 0;
  }

  /**
   * Advance playback. Returns the updated state. When a choice is pending this
   * is a no-op until `select` is called.
   */
  next(): RuntimeState {
    if (this.state.finished || this.state.choices) return this.state;

    while (true) {
      const commands = this.commandsFor(this.sceneId);
      if (this.index >= commands.length) {
        this.state.finished = true;
        return this.state;
      }
      const cmd = commands[this.index++];
      if (this.apply(cmd)) return this.state; // stop point reached
    }
  }

  /** Resolve a pending choice by option index. */
  select(optionIndex: number): RuntimeState {
    const choices = this.state.choices;
    if (!choices) return this.state;
    const option = choices[optionIndex];
    this.state.choices = null;
    if (option) this.gotoScene(option.goto);
    return this.next();
  }

  /**
   * Apply a command to the state. Returns true if this command is a "stop
   * point" (a line to read or a choice to make), false to keep advancing.
   */
  private apply(cmd: Command): boolean {
    switch (cmd.kind) {
      case "bg":
        this.state.background = cmd.asset;
        return false;
      case "bgm":
        this.state.bgm = cmd.asset;
        return false;
      case "se":
        // v1: sound effects are a no-op placeholder beyond state passthrough.
        return false;
      case "show": {
        const others = this.state.characters.filter((c) => c.char !== cmd.char);
        this.state.characters = [...others, { char: cmd.char, at: cmd.at }];
        return false;
      }
      case "hide":
        this.state.characters = this.state.characters.filter((c) => c.char !== cmd.char);
        return false;
      case "effect":
        this.state.effect = cmd.effect;
        this.state.effectToken++;
        return false;
      case "wait":
        // v1: timing is handled by the view; treat as non-stopping.
        return false;
      case "say":
        this.state.speaker = cmd.speaker ? this.speakerName(cmd.speaker) : null;
        this.state.text = cmd.text;
        return true;
      case "choice":
        this.state.choices = cmd.options;
        return true;
      case "jump":
        this.gotoScene(cmd.target);
        return false;
      case "end":
        this.state.finished = true;
        return true;
    }
  }
}
