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
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 p-4">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="w-full max-w-md rounded-xl bg-white/90 px-6 py-4 text-center text-base font-medium text-slate-800 shadow-lg transition hover:bg-white hover:scale-[1.02] sm:text-lg"
        >
          {opt.text}
        </button>
      ))}
    </div>
  );
}
