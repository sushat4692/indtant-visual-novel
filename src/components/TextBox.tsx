import { parseRichText } from "./richText";

/** The dialogue text box shown at the bottom of the stage. */
export function TextBox({ speaker, text }: { speaker: string | null; text: string }) {
  if (!text && !speaker) return null;
  const segments = parseRichText(text);
  return (
    <div className="absolute inset-x-0 bottom-0 p-[2%]">
      <div className="rounded-2xl bg-black/70 p-[1em] text-white shadow-2xl backdrop-blur-sm">
        {speaker && (
          <div className="mb-[0.3em] text-[1.1em] font-bold text-sky-300">{speaker}</div>
        )}
        <p className="min-h-[3em] whitespace-pre-wrap leading-relaxed">
          {segments.map((seg, i) => (
            <span
              key={i}
              style={{
                ...(seg.color ? { color: seg.color } : {}),
                ...(seg.em   ? { fontSize: `${seg.em}em` } : {}),
              }}
            >
              {seg.text}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
