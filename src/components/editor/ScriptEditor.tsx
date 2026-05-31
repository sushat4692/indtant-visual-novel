import { useMemo } from "react";
import type { ParseError } from "../../engine/types";
import { useCodeMirror } from "./useCodeMirror";
import { vnLanguage, type CompletionData } from "./vnLanguage";

/** CodeMirror-based editor for the visual novel DSL. */
export function ScriptEditor({
  value,
  onChange,
  errors,
  onCursorChange,
  completionData,
}: {
  value: string;
  onChange: (next: string) => void;
  errors: ParseError[];
  onCursorChange?: (line: number) => void;
  completionData?: CompletionData;
}) {
  const data: CompletionData = completionData ?? {
    characterKeys: [],
    sceneIds: [],
    assetIds: [],
  };

  const extensions = useMemo(() => vnLanguage(data), [
    // Re-create extensions when completion data changes (new chars/scenes/assets).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    data.characterKeys.join(","),
    data.sceneIds.join(","),
    data.assetIds.join(","),
  ]);

  const { ref } = useCodeMirror({ value, onChange, onCursorChange, extensions });

  return (
    <div className="flex h-full flex-col">
      <div ref={ref} className="flex-1 overflow-hidden rounded-lg" />
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
