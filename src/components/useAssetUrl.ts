import { useEffect, useState } from "react";
import { getAssetUrl } from "../storage/assetStore";
import type { Orientation } from "../engine/types";
import { DEFAULT_ORIENTATION } from "../engine/orientation";

/**
 * Resolve an asset id to a URL (builtin data URL or uploaded object URL).
 * Builtin backgrounds resolve to the variant matching `orientation`.
 * Returns null while loading or when the id is unknown/empty.
 */
export function useAssetUrl(
  id: string | null,
  orientation: Orientation = DEFAULT_ORIENTATION,
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!id) {
      setUrl(null);
      return;
    }
    getAssetUrl(id, orientation).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [id, orientation]);

  return url;
}
