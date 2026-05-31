import type { CommandDef } from "../types";
import { bgCommand } from "./bg";
import { showCommand, hideCommand } from "./show";
import { animCommand } from "./anim";
import { effectCommand } from "./effect";
import { bgmCommand, seCommand } from "./audio";
import { waitCommand } from "./wait";
import { choiceCommand } from "./choice";
import { jumpCommand } from "./jump";
import { endCommand } from "./end";
import { sayCommand } from "./say";

/**
 * The command registry. Definitions are tried in order and the first whose
 * `match` returns true handles the line.
 *
 * To add a new DSL expression: implement a CommandDef in this folder and add it
 * here. `sayCommand` must stay last because it is the dialogue fallback.
 */
export const COMMAND_REGISTRY: CommandDef[] = [
  bgCommand,
  showCommand,
  hideCommand,
  animCommand,
  effectCommand,
  bgmCommand,
  seCommand,
  waitCommand,
  jumpCommand,
  endCommand,
  choiceCommand,
  sayCommand,
];
