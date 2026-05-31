import type { Command, ChoiceOption, Position, Project } from "./types";
import { parseScene } from "./parser";

const SPEED_PRESETS: Record<string, number> = { slow: 1.4, normal: 0.7, fast: 0.35 };
function parseTransitionDuration(speed?: string): number {
  if (!speed) return 0.7;
  if (SPEED_PRESETS[speed]) return SPEED_PRESETS[speed];
  const n = parseFloat(speed);
  return isFinite(n) && n > 0 ? n : 0.7;
}

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
  /** Last SE that fired (one-shot audio). */
  se: string | null;
  /** Monotonic token so the view can re-trigger the same SE. */
  seToken: number;
  speaker: string | null;
  text: string;
  /** Choice menu currently awaiting selection, or null. */
  choices: ChoiceOption[] | null;
  /** True once `end` was reached or the script ran out. */
  finished: boolean;
  /** Text to display on the end screen (empty string = show default "おわり"). */
  endText: string;
  /** Scene-entry transition name (e.g. "fade", "white"), or null. */
  transition: string | null;
  /** Monotonic token so the view can re-trigger the same transition. */
  transitionToken: number;
  /** Transition duration in seconds (default 0.7). */
  transitionDuration: number;
}

function emptyState(): RuntimeState {
  return {
    background: null,
    bgm: null,
    characters: [],
    effect: null,
    effectToken: 0,
    se: null,
    seToken: 0,
    speaker: null,
    text: "",
    choices: null,
    finished: false,
    endText: "",
    transition: null,
    transitionToken: 0,
    transitionDuration: 0.7,
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

  /**
   * Seek to the command at or just before the given 1-based source line number,
   * fast-forwarding all preceding commands to reconstruct state (bg, characters,
   * bgm, etc.), then advance to the first stop point.
   */
  seekToLine(lineNumber: number, sceneId?: string): RuntimeState {
    // Reset to the target scene so jump-induced scene changes don't redirect the seek.
    if (sceneId) this.sceneId = sceneId;
    const commands = this.commandsFor(this.sceneId);
    let targetIndex = 0;
    for (let i = 0; i < commands.length; i++) {
      if (commands[i].line <= lineNumber) targetIndex = i;
      else break;
    }
    this.state = emptyState();
    this.index = 0;
    for (let i = 0; i < targetIndex; i++) {
      this.apply(commands[i]);
      this.index = i + 1;
    }
    return this.next();
  }

  /** Resolve a pending choice by option index. */
  select(optionIndex: number): RuntimeState {
    const choices = this.state.choices;
    if (!choices) return this.state;
    const option = choices[optionIndex];
    this.state.choices = null;
    if (option) {
      if (option.transition) {
        this.state.transition = option.transition;
        this.state.transitionDuration = parseTransitionDuration(option.speed);
        this.state.transitionToken++;
      }
      this.gotoScene(option.goto);
    }
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
        this.state.se = cmd.asset;
        this.state.seToken++;
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
        if (cmd.transition) {
          this.state.transition = cmd.transition;
          this.state.transitionDuration = parseTransitionDuration(cmd.speed);
          this.state.transitionToken++;
        }
        this.gotoScene(cmd.target);
        return false;
      case "end":
        this.state.finished = true;
        this.state.endText = cmd.text ?? "";
        return true;
    }
  }

  /** Reset to the beginning and advance to the first stop point. */
  reset(): RuntimeState {
    this.sceneId = this.project.meta.startScene;
    this.index = 0;
    this.state = emptyState();
    return this.next();
  }
}
