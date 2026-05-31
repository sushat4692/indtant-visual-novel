import type { ParseError, Project } from "./types";
import { parseScene } from "./parser";
import { isBuiltinAsset } from "../assets/builtinRegistry";

/**
 * Validate a whole project: parse every scene and check that referenced scenes,
 * characters and assets exist. `knownAssetIds` is the set of uploaded asset ids
 * (builtin ids are checked via the builtin registry).
 *
 * Returns a flat list of errors (empty = valid). Each error carries the scene
 * id and the 1-based line within that scene.
 */
export function validateProject(project: Project, knownAssetIds: Set<string>): ParseError[] {
  const errors: ParseError[] = [];
  const sceneIds = new Set(Object.keys(project.scenes));
  const charKeys = new Set(Object.keys(project.meta.characters));

  if (!sceneIds.has(project.meta.startScene)) {
    errors.push({
      line: 0,
      message: `開始シーン "${project.meta.startScene}" が存在しません`,
    });
  }

  const assetKnown = (id: string) => isBuiltinAsset(id) || knownAssetIds.has(id);

  for (const scene of Object.values(project.scenes)) {
    const result = parseScene(scene.script);
    if (!result.ok) {
      for (const e of result.errors) errors.push({ ...e, scene: scene.id });
      continue;
    }
    for (const cmd of result.commands) {
      const at = (message: string) => errors.push({ scene: scene.id, line: cmd.line, message });
      switch (cmd.kind) {
        case "bg":
        case "bgm":
        case "se":
          if (!assetKnown(cmd.asset)) at(`未知のアセットID: "${cmd.asset}"`);
          break;
        case "show":
        case "hide":
          if (!charKeys.has(cmd.char)) at(`未定義のキャラクター: "${cmd.char}"`);
          break;
        case "say":
          if (cmd.speaker && !charKeys.has(cmd.speaker)) {
            at(`未定義のキャラクター: "${cmd.speaker}"`);
          }
          break;
        case "jump":
          if (!sceneIds.has(cmd.target)) at(`未知の遷移先シーン: "${cmd.target}"`);
          break;
        case "choice":
          for (const opt of cmd.options) {
            if (!sceneIds.has(opt.goto)) at(`未知の遷移先シーン: "${opt.goto}"`);
          }
          break;
      }
    }
  }

  return errors;
}
