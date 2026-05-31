import { getDB, type StoredAsset } from "./db";
import { getBuiltinAsset } from "../assets/builtinRegistry";
import type { Orientation } from "../engine/types";
import { DEFAULT_ORIENTATION } from "../engine/orientation";

/** Cache of object URLs created for uploaded asset blobs, keyed by asset id. */
const objectUrlCache = new Map<string, string>();

export async function listAssets(): Promise<StoredAsset[]> {
  const db = await getDB();
  return db.getAll("assets");
}

export async function getAsset(id: string): Promise<StoredAsset | undefined> {
  const db = await getDB();
  return db.get("assets", id);
}

export async function saveAsset(asset: StoredAsset): Promise<void> {
  const db = await getDB();
  await db.put("assets", asset);
  // Invalidate a stale cached URL if the blob changed.
  const cached = objectUrlCache.get(asset.id);
  if (cached) {
    URL.revokeObjectURL(cached);
    objectUrlCache.delete(asset.id);
  }
}

/**
 * Resolve an asset id to a displayable URL. Builtin ids resolve to their inline
 * data URL for the given orientation (backgrounds have per-orientation variants);
 * uploaded ids resolve to an object URL for the stored blob. Returns null when
 * the id is unknown.
 */
export async function getAssetUrl(
  id: string,
  orientation: Orientation = DEFAULT_ORIENTATION,
): Promise<string | null> {
  const builtin = getBuiltinAsset(id);
  if (builtin) return builtin.urlFor(orientation);

  const cached = objectUrlCache.get(id);
  if (cached) return cached;

  const asset = await getAsset(id);
  if (!asset) return null;
  const url = URL.createObjectURL(asset.blob);
  objectUrlCache.set(id, url);
  return url;
}

/** Generate a fresh uploaded-asset id. */
export function newAssetId(): string {
  return `up_${crypto.randomUUID().slice(0, 8)}`;
}
