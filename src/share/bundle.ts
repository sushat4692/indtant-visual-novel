import type { Project } from "../engine/types";
import { getAsset, saveAsset } from "../storage/assetStore";
import type { StoredAsset } from "../storage/db";

/** A serialized uploaded asset (blob encoded as a data URL). */
export interface BundledAsset {
  id: string;
  type: StoredAsset["type"];
  name: string;
  dataUrl: string;
}

/** The portable representation of a project plus its uploaded assets. */
export interface ProjectBundle {
  project: Project;
  assets: BundledAsset[];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/**
 * Build a portable bundle from a project, inlining only the uploaded assets the
 * project actually references. Builtin assets are referenced by id and not
 * embedded.
 */
export async function buildBundle(project: Project): Promise<ProjectBundle> {
  const assets: BundledAsset[] = [];
  for (const id of project.uploadedAssetIds) {
    const stored = await getAsset(id);
    if (!stored) continue;
    assets.push({
      id: stored.id,
      type: stored.type,
      name: stored.name,
      dataUrl: await blobToDataUrl(stored.blob),
    });
  }
  return { project, assets };
}

/**
 * Persist a bundle's uploaded assets to storage. Returns the project contained
 * in the bundle (the caller decides id/lock handling before saving it).
 */
export async function restoreBundleAssets(bundle: ProjectBundle): Promise<void> {
  for (const a of bundle.assets) {
    await saveAsset({
      id: a.id,
      type: a.type,
      name: a.name,
      blob: await dataUrlToBlob(a.dataUrl),
    });
  }
}
