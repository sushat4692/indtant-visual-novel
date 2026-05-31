import { useEffect } from "react";
import { useAssetUrl } from "./useAssetUrl";

/** Play a one-shot sound effect. Fires whenever `token` increments. */
export function useSe(assetId: string | null, token: number) {
  const url = useAssetUrl(assetId, "landscape");

  // Depend only on token: play when the token changes, not when url resolves.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!url || token === 0) return;
    new Audio(url).play().catch(() => {});
  }, [token]);
}
