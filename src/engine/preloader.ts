import type { Project, Orientation } from "./types";
import { parseScene } from "./parser";
import { getAssetUrl } from "../storage/assetStore";

/** Collect all asset IDs referenced by the project (scenes + title bg). */
export function collectAssetIds(project: Project): { images: string[]; audio: string[] } {
  const images = new Set<string>();
  const audio = new Set<string>();

  if (project.meta.titleBg) images.add(project.meta.titleBg);

  for (const scene of Object.values(project.scenes)) {
    const result = parseScene(scene.script);
    if (!result.ok) continue;
    for (const cmd of result.commands) {
      switch (cmd.kind) {
        case "bg":
          images.add(cmd.asset);
          break;
        case "show": {
          const charDef = project.meta.characters[cmd.char];
          if (charDef) images.add(charDef.sprite);
          break;
        }
        case "bgm":
          if (cmd.asset) audio.add(cmd.asset);
          break;
        case "se":
          audio.add(cmd.asset);
          break;
      }
    }
  }

  return { images: [...images], audio: [...audio] };
}

function loadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = url;
  });
}

function loadAudio(url: string): Promise<void> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.oncanplaythrough = a.onerror = () => resolve();
    a.src = url;
    a.load();
  });
}

/**
 * Resolve and preload all project assets into the browser's decode/buffer cache.
 * Works with data URIs (current builtin SVGs) and remote URLs (future real assets).
 * `onProgress` is called after each asset resolves.
 */
export async function preloadAll(
  project: Project,
  orientation: Orientation,
  onProgress: (loaded: number, total: number) => void,
): Promise<void> {
  const { images, audio } = collectAssetIds(project);
  const total = images.length + audio.length;

  if (total === 0) {
    onProgress(0, 0);
    return;
  }

  let loaded = 0;
  const tick = () => onProgress(++loaded, total);

  await Promise.all([
    ...images.map(async (id) => {
      const url = await getAssetUrl(id, orientation);
      if (url) await loadImage(url);
      tick();
    }),
    ...audio.map(async (id) => {
      const url = await getAssetUrl(id, orientation);
      if (url) await loadAudio(url);
      tick();
    }),
  ]);
}
