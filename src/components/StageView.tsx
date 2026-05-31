import { useEffect, useState } from "react";
import type { Orientation, Project } from "../engine/types";
import type { RuntimeState } from "../engine/runtime";
import { resolveOrientation } from "../engine/orientation";
import { useAssetUrl } from "./useAssetUrl";
import { useBgm } from "./useBgm";
import { useSe } from "./useSe";
import { useFitBox } from "./useFitBox";
import { CharacterLayer } from "./CharacterLayer";
import { TextBox } from "./TextBox";
import { ChoiceMenu } from "./ChoiceMenu";

/** Aspect ratio (width / height) for each orientation. */
const ASPECT_RATIO: Record<Orientation, number> = {
  landscape: 16 / 9,
  portrait: 9 / 16,
};

/** Map an effect name to a one-shot CSS animation class (see index.css). */
const EFFECT_CLASS: Record<string, string> = {
  shake: "vn-shake",
  flash: "vn-flash",
  fade: "vn-fade",
  fadeout: "vn-fadeout",
};

export interface StageViewProps {
  project: Project;
  state: RuntimeState;
  /**
   * Stage orientation. Defaults to the project's saved orientation; the editor
   * preview passes a transient override so authors can check both ratios.
   */
  orientation?: Orientation;
  /** When provided, a tap on the stage advances (player mode). */
  onAdvance?: () => void;
  /** Selecting a choice option. */
  onSelect?: (index: number) => void;
  /** Enable audio playback (off by default; turn on in the full player). */
  enableAudio?: boolean;
}

/**
 * Renders the current runtime state at a fixed aspect ratio (16:9 landscape /
 * 9:16 portrait), letterboxed to fit its container. Shared by the player and the
 * editor's live preview. Effects are driven by `state.effectToken` so the same
 * effect can replay.
 */
export function StageView({ project, state, orientation, onAdvance, onSelect, enableAudio }: StageViewProps) {
  const stageOrientation = resolveOrientation(orientation ?? project.meta.orientation);
  const bgUrl = useAssetUrl(state.background, stageOrientation);
  useBgm(enableAudio ? state.bgm : null);
  useSe(enableAudio ? state.se : null, enableAudio ? state.seToken : 0);
  const { ref: fitRef, size } = useFitBox(ASPECT_RATIO[stageOrientation]);
  const [effectClass, setEffectClass] = useState("");

  useEffect(() => {
    if (!state.effect) return;
    const cls = EFFECT_CLASS[state.effect] ?? "";
    setEffectClass(cls);
    const timer = setTimeout(() => setEffectClass(""), 800);
    return () => clearTimeout(timer);
  }, [state.effect, state.effectToken]);

  return (
    <div ref={fitRef} className="flex h-full w-full overflow-hidden items-center justify-center">
      <div
        className={`relative overflow-hidden rounded-lg bg-slate-900 ${effectClass}`}
        style={
          size
            ? {
                width: size.width,
                height: size.height,
                // Scale all em-based children proportionally to stage width.
                fontSize: `clamp(10px, ${(size.width / 45).toFixed(2)}px, 28px)`,
              }
            : { aspectRatio: stageOrientation === "portrait" ? "9 / 16" : "16 / 9", width: "100%" }
        }
        onClick={() => {
          if (!state.choices) onAdvance?.();
        }}
        role={onAdvance ? "button" : undefined}
      >
        {bgUrl && (
          <img src={bgUrl} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        )}
        <CharacterLayer characters={state.characters} project={project} />
        <TextBox speaker={state.speaker} text={state.text} />
        {state.choices && onSelect && <ChoiceMenu options={state.choices} onSelect={onSelect} />}
        {state.finished && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-[1.5em] font-bold text-white">
            おわり
          </div>
        )}
      </div>
    </div>
  );
}
