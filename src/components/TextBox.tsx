/** The dialogue text box shown at the bottom of the stage. */
export function TextBox({ speaker, text }: { speaker: string | null; text: string }) {
  if (!text && !speaker) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
      <div className="mx-auto max-w-4xl rounded-2xl bg-black/70 p-4 text-white shadow-2xl backdrop-blur-sm sm:p-6">
        {speaker && <div className="mb-1 text-base font-bold text-sky-300 sm:text-lg">{speaker}</div>}
        <p className="min-h-[3rem] whitespace-pre-wrap text-base leading-relaxed sm:text-lg">{text}</p>
      </div>
    </div>
  );
}
