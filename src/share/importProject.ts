import type { Project } from "../engine/types";
import { restoreBundleAssets, type ProjectBundle } from "./bundle";
import { decryptJson } from "./crypto";
import { isExportFile, type ExportFile, type PlayFile } from "./format";
import { saveProject } from "../storage/projectStore";

/** Parse a dropped/selected file's text into a known export file. */
export function parseExportFile(text: string): ExportFile {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("ファイルを JSON として読み込めませんでした");
  }
  if (!isExportFile(value)) {
    throw new Error("これは Instant Visual Novel のエクスポートファイルではありません");
  }
  return value;
}

/** Give the imported project a fresh id so it never clobbers an existing one. */
function reidentify(project: Project, locked: boolean): Project {
  return {
    ...project,
    id: crypto.randomUUID(),
    name: project.name + "（インポート）",
    updatedAt: Date.now(),
    locked,
  };
}

async function importBundle(bundle: ProjectBundle, locked: boolean): Promise<Project> {
  await restoreBundleAssets(bundle);
  const project = reidentify(bundle.project, locked);
  await saveProject(project);
  return project;
}

/** Import an editable file as a normal, editable project. */
export async function importEditable(file: ExportFile): Promise<Project> {
  if (file.mode !== "editable") throw new Error("編集可能ファイルではありません");
  return importBundle(file.bundle, false);
}

/**
 * Import a play-only file: decrypt with the password and store as a locked,
 * play-only project (editor disabled). Throws on a wrong password.
 */
export async function importPlayLocked(file: PlayFile, password: string): Promise<Project> {
  let bundle: ProjectBundle;
  try {
    bundle = await decryptJson<ProjectBundle>(file.enc, password);
  } catch {
    throw new Error("パスワードが正しくありません");
  }
  return importBundle(bundle, true);
}
