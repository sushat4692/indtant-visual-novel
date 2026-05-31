import type { ParseError } from "../../engine/types";

function getCursorLine(value: string, selectionStart: number): number {
  return value.slice(0, selectionStart).split("\n").length;
}

/** Plain textarea editor for a scene's DSL, with an inline error list. */
export function ScriptEditor({
  value,
  onChange,
  errors,
  onCursorChange,
}: {
  value: string;
  onChange: (next: string) => void;
  errors: ParseError[];
  onCursorChange?: (line: number) => void;
}) {
  const notifyCursor = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    onCursorChange?.(getCursorLine(value, e.currentTarget.selectionStart));
  };

  return (
    <div className="flex h-full flex-col">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={notifyCursor}
        onKeyUp={notifyCursor}
        onSelect={notifyCursor}
        spellCheck={false}
        className="flex-1 w-full resize-none rounded-lg border border-slate-300 bg-slate-900 p-3 font-mono text-sm leading-relaxed text-slate-100 outline-none focus:border-sky-500"
        placeholder={"bg bg_classroom\nshow taro left\n太郎: やあ。\n-> 選択肢 : next_scene"}
      />
      {errors.length > 0 && (
        <div className="mt-2 max-h-28 overflow-y-auto rounded-lg bg-red-50 p-2 text-xs text-red-700">
          {errors.map((e, i) => (
            <div key={i}>
              {e.line > 0 ? `${e.line}行目: ` : ""}
              {e.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
