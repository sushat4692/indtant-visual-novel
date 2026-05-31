import { useEffect, useRef } from "react";
import { useAssetUrl } from "./useAssetUrl";

/** Play a looping BGM track by asset ID. Pass null to stop. */
export function useBgm(assetId: string | null) {
  const url = useAssetUrl(assetId, "landscape");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (!url) return;

    const audio = new Audio(url);
    audio.loop = true;
    audio.play().catch(() => {});
    audioRef.current = audio;

    return () => {
      audio.pause();
    };
  }, [url]);
}
