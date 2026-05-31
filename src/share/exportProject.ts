import type { Project } from "../engine/types";
import { buildBundle } from "./bundle";
import { encryptJson } from "./crypto";
import { FILE_VERSION, type EditableFile, type PlayFile } from "./format";

function sanitize(name: string): string {
  return name.replace(/[^\w\-一-龠ぁ-んァ-ヶ]+/g, "_").slice(0, 40) || "project";
}

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Export an editable (plaintext) bundle as `<name>.vnproj.json`. */
export async function exportEditable(project: Project): Promise<void> {
  const bundle = await buildBundle(project);
  const file: EditableFile = {
    format: "instant-visual-novel",
    version: FILE_VERSION,
    mode: "editable",
    bundle,
  };
  downloadJson(file, `${sanitize(project.name)}.vnproj.json`);
}

/**
 * Export a play-only, password-encrypted bundle as `<name>.vnplay.json`. The
 * imported result cannot be opened in the editor.
 */
export async function exportPlayLocked(project: Project, password: string): Promise<void> {
  const bundle = await buildBundle(project);
  const enc = await encryptJson(bundle, password);
  const file: PlayFile = {
    format: "instant-visual-novel",
    version: FILE_VERSION,
    mode: "play",
    title: project.meta.title || project.name,
    enc,
  };
  downloadJson(file, `${sanitize(project.name)}.vnplay.json`);
}

/** Approximate the serialized size (bytes) of a project's uploaded assets. */
export async function estimateBundleSize(project: Project): Promise<number> {
  const bundle = await buildBundle(project);
  return bundle.assets.reduce((sum, a) => sum + a.dataUrl.length, 0);
}
