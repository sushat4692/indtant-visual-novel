import { useEffect, useState } from "react";
import type { Project } from "../engine/types";
import type { RuntimeState } from "../engine/runtime";
import { useAssetUrl } from "./useAssetUrl";
import { CharacterLayer } from "./CharacterLayer";
import { TextBox } from "./TextBox";
import { ChoiceMenu } from "./ChoiceMenu";

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
  /** When provided, a tap on the stage advances (player mode). */
  onAdvance?: () => void;
  /** Selecting a choice option. */
  onSelect?: (index: number) => void;
}

/**
 * Renders the current runtime state. Shared by the player and the editor's live
 * preview. Effects are driven by `state.effectToken` so the same effect can
 * replay.
 */
export function StageView({ project, state, onAdvance, onSelect }: StageViewProps) {
  const bgUrl = useAssetUrl(state.background);
  const [effectClass, setEffectClass] = useState("");

  useEffect(() => {
    if (!state.effect) return;
    const cls = EFFECT_CLASS[state.effect] ?? "";
    setEffectClass(cls);
    const timer = setTimeout(() => setEffectClass(""), 800);
    return () => clearTimeout(timer);
  }, [state.effect, state.effectToken]);

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900 ${effectClass}`}
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-xl font-bold text-white">
          おわり
        </div>
      )}
    </div>
  );
}
