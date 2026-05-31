import { useEffect, useState } from "react";
import { getAssetUrl } from "../storage/assetStore";

/**
 * Resolve an asset id to a URL (builtin data URL or uploaded object URL).
 * Returns null while loading or when the id is unknown/empty.
 */
export function useAssetUrl(id: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!id) {
      setUrl(null);
      return;
    }
    getAssetUrl(id).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false;
    };
  }, [id]);

  return url;
}
