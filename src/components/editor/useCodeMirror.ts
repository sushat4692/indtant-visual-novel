import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";

export function useCodeMirror(opts: {
  value: string;
  onChange: (v: string) => void;
  onCursorChange?: (line: number) => void;
  extensions: Extension[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  // Track whether the last change originated in the editor to avoid loops.
  const fromEditor = useRef(false);

  // Stable refs for callbacks so the editor closure stays valid.
  const onChangeRef = useRef(opts.onChange);
  const onCursorRef = useRef(opts.onCursorChange);
  useEffect(() => { onChangeRef.current = opts.onChange; }, [opts.onChange]);
  useEffect(() => { onCursorRef.current = opts.onCursorChange; }, [opts.onCursorChange]);

  // Create the editor once on mount.
  useEffect(() => {
    if (!containerRef.current || viewRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: opts.value,
        extensions: [
          history(),
          closeBrackets(),
          keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap]),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              fromEditor.current = true;
              onChangeRef.current(update.state.doc.toString());
              fromEditor.current = false;
            }
            if (update.selectionSet || update.docChanged) {
              const line = update.state.doc.lineAt(update.state.selection.main.head).number;
              onCursorRef.current?.(line);
            }
          }),
          languageCompartment.current.of(opts.extensions),
        ],
      }),
      parent: containerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once only

  // Re-configure language/autocomplete extensions when completionData changes.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: languageCompartment.current.reconfigure(opts.extensions) });
  }, [opts.extensions]);

  // Sync value from outside (e.g. scene switch) without triggering onChange.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || fromEditor.current) return;
    const current = view.state.doc.toString();
    if (current === opts.value) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: opts.value },
    });
  }, [opts.value]);

  return { ref: containerRef };
}
