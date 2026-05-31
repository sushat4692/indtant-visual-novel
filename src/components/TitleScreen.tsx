import { useEffect, useState } from "react";
import type { Project, Orientation } from "../engine/types";
import { resolveOrientation } from "../engine/orientation";
import { preloadAll } from "../engine/preloader";
import { useAssetUrl } from "./useAssetUrl";
import { useFitBox } from "./useFitBox";

const ASPECT_RATIO: Record<Orientation, number> = {
  landscape: 16 / 9,
  portrait: 9 / 16,
};

interface Props {
  project: Project;
  onStart: () => void;
}

export function TitleScreen({ project, onStart }: Props) {
  const orientation = resolveOrientation(project.meta.orientation);
  const bgUrl = useAssetUrl(project.meta.titleBg ?? null, orientation);
  const { ref, size } = useFitBox(ASPECT_RATIO[orientation]);

  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    preloadAll(project, orientation, (ld, tot) => {
      setLoaded(ld);
      setTotal(tot);
    });
  }, [project, orientation]);

  const isReady = total !== null && loaded >= total;
  const progressPct = total ? Math.round((loaded / total) * 100) : 100;

  return (
    <div ref={ref} className="flex h-full w-full overflow-hidden items-center justify-center">
      <div
        className="relative overflow-hidden rounded-lg flex flex-col items-center justify-center"
        style={
          size
            ? { width: size.width, height: size.height }
            : { aspectRatio: orientation === "portrait" ? "9 / 16" : "16 / 9", width: "100%" }
        }
      >
        {/* Background */}
        {bgUrl ? (
          <img src={bgUrl} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black" />
        )}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            {project.meta.title || project.name}
          </h1>

          {/* Progress bar (hidden when ready) */}
          {!isReady && (
            <div className="w-48 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white/70 transition-all duration-200"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-white/50">読み込み中… {progressPct}%</p>
            </div>
          )}

          <button
            onClick={onStart}
            disabled={!isReady}
            className="rounded-full border border-white/50 bg-white/20 px-8 py-3 text-lg font-medium text-white backdrop-blur-sm transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            始める
          </button>
        </div>
      </div>
    </div>
  );
}
