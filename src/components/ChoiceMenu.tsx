import type { ChoiceOption } from "../engine/types";

/** A vertical list of choices overlaid on the stage. */
export function ChoiceMenu({
  options,
  onSelect,
}: {
  options: ChoiceOption[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.75em] bg-black/40 p-[1em]">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="w-full max-w-[80%] rounded-xl bg-white/90 px-[1.5em] py-[0.75em] text-center font-medium text-slate-800 shadow-lg transition hover:bg-white hover:scale-[1.02]"
        >
          {opt.text}
        </button>
      ))}
    </div>
  );
}
