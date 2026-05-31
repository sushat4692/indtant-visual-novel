/** The dialogue text box shown at the bottom of the stage. */
export function TextBox({ speaker, text }: { speaker: string | null; text: string }) {
  if (!text && !speaker) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 p-[2%]">
      <div className="rounded-2xl bg-black/70 p-[1em] text-white shadow-2xl backdrop-blur-sm">
        {speaker && (
          <div className="mb-[0.3em] text-[1.1em] font-bold text-sky-300">{speaker}</div>
        )}
        <p className="min-h-[3em] whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
