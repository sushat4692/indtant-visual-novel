import { ViewPlugin, Decoration, EditorView } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { autocompletion, type CompletionContext, type Completion } from "@codemirror/autocomplete";

export interface CompletionData {
  characterKeys: string[];
  sceneIds: string[];
  assetIds: string[];
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export const vnTheme = EditorView.theme({
  // "&" targets the root .cm-editor element itself (dark background).
  "&": {
    height: "100%",
    backgroundColor: "#0f172a",
    borderRadius: "0.5rem",
    border: "1px solid #cbd5e1",
    fontSize: "0.875rem",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  "&.cm-focused": { outline: "none", borderColor: "#0ea5e9" },
  ".cm-scroller": { height: "100%" },
  ".cm-content": {
    padding: "12px",
    lineHeight: "1.75",
    color: "#e2e8f0",
    caretColor: "#e2e8f0",
  },
  ".cm-gutters": { display: "none" },
  ".cm-cursor": { borderLeftColor: "#e2e8f0" },
  ".cm-selectionBackground, ::selection": { backgroundColor: "#1e40af66 !important" },
  ".cm-activeLine": { backgroundColor: "#ffffff0a" },
  // Autocomplete popup
  ".cm-tooltip": { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "6px" },
  ".cm-tooltip-autocomplete ul": { margin: 0, padding: "2px" },
  ".cm-tooltip-autocomplete ul li": { padding: "3px 8px", borderRadius: "4px", color: "#e2e8f0" },
  ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "#0ea5e9", color: "#fff" },
  ".cm-completionMatchedText": { textDecoration: "none", fontWeight: "bold" },
});

// ---------------------------------------------------------------------------
// Syntax highlighting via Decoration
// ---------------------------------------------------------------------------

const KEYWORD_RE =
  /^(bg|show|hide|bgm|se|wait|jump|end)\b/;
const CHOICE_RE = /^->/;
const EFFECT_RE = /^@/;
const SAY_RE = /^([^\s:][^:]*)?:/;
const COMMENT_RE = /#.*/;
const POSITION_RE = /\b(left|center|right)\b/g;
const OFF_RE = /\boff\b/g;

const hl = {
  keyword: Decoration.mark({ class: "cm-vn-keyword" }),
  effect: Decoration.mark({ class: "cm-vn-effect" }),
  choice: Decoration.mark({ class: "cm-vn-choice" }),
  speaker: Decoration.mark({ class: "cm-vn-speaker" }),
  comment: Decoration.mark({ class: "cm-vn-comment" }),
  position: Decoration.mark({ class: "cm-vn-position" }),
  off: Decoration.mark({ class: "cm-vn-off" }),
};

function buildDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      const text = line.text;
      const start = line.from;

      // Comment
      const commentMatch = COMMENT_RE.exec(text);
      if (commentMatch) {
        builder.add(start + commentMatch.index, start + text.length, hl.comment);
        pos = line.to + 1;
        continue;
      }

      const trimmed = text.trimStart();
      const offset = text.length - trimmed.length;

      if (CHOICE_RE.test(trimmed)) {
        builder.add(start + offset, start + offset + 2, hl.choice);
      } else if (EFFECT_RE.test(trimmed)) {
        builder.add(start + offset, start + text.length, hl.effect);
      } else if (KEYWORD_RE.test(trimmed)) {
        const kw = KEYWORD_RE.exec(trimmed)![1];
        builder.add(start + offset, start + offset + kw.length, hl.keyword);
        // position args
        const rest = trimmed.slice(kw.length);
        let m: RegExpExecArray | null;
        POSITION_RE.lastIndex = 0;
        while ((m = POSITION_RE.exec(rest)) !== null) {
          const s = start + offset + kw.length + m.index;
          builder.add(s, s + m[0].length, hl.position);
        }
        // bgm off
        OFF_RE.lastIndex = 0;
        while ((m = OFF_RE.exec(rest)) !== null) {
          const s = start + offset + kw.length + m.index;
          builder.add(s, s + m[0].length, hl.off);
        }
      } else if (SAY_RE.test(trimmed)) {
        const m = SAY_RE.exec(trimmed)!;
        if (m[1]) {
          builder.add(start + offset, start + offset + m[1].length, hl.speaker);
        }
      }

      pos = line.to + 1;
    }
  }
  return builder.finish();
}

const highlightPlugin = ViewPlugin.fromClass(
  class {
    decorations;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: { docChanged: boolean; viewportChanged: boolean; view: EditorView }) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

export const vnHighlightStyle = EditorView.baseTheme({
  // Colors tuned for dark (#0f172a) background — all pass WCAG AA on dark.
  ".cm-vn-keyword": { color: "#7dd3fc", fontWeight: "600" },   // sky-300
  ".cm-vn-effect": { color: "#c4b5fd", fontWeight: "600" },    // violet-300
  ".cm-vn-choice": { color: "#fcd34d", fontWeight: "700" },    // amber-300
  ".cm-vn-speaker": { color: "#6ee7b7", fontWeight: "600" },   // emerald-300
  ".cm-vn-comment": { color: "#64748b", fontStyle: "italic" }, // slate-500
  ".cm-vn-position": { color: "#86efac" },                     // green-300
  ".cm-vn-off": { color: "#fca5a5" },                          // red-300
});

// ---------------------------------------------------------------------------
// Autocomplete
// ---------------------------------------------------------------------------

const COMMANDS: Completion[] = [
  { label: "bg", type: "keyword", detail: "背景を設定" },
  { label: "show", type: "keyword", detail: "キャラクターを表示" },
  { label: "hide", type: "keyword", detail: "キャラクターを非表示" },
  { label: "bgm", type: "keyword", detail: "BGMを再生" },
  { label: "se", type: "keyword", detail: "効果音を再生" },
  { label: "wait", type: "keyword", detail: "待機 (ミリ秒)" },
  { label: "jump", type: "keyword", detail: "シーン移動" },
  { label: "end", type: "keyword", detail: "シーン終了" },
  { label: "->", type: "keyword", detail: "選択肢" },
  { label: "@shake", type: "function", detail: "揺れエフェクト" },
  { label: "@flash", type: "function", detail: "フラッシュエフェクト" },
  { label: "@fade", type: "function", detail: "フェードエフェクト" },
  { label: "@fadeout", type: "function", detail: "フェードアウトエフェクト" },
];

const POSITIONS: Completion[] = [
  { label: "left", type: "enum" },
  { label: "center", type: "enum" },
  { label: "right", type: "enum" },
];

const EFFECTS: Completion[] = [
  { label: "shake", type: "function" },
  { label: "flash", type: "function" },
  { label: "fade", type: "function" },
  { label: "fadeout", type: "function" },
];

const TRANSITION_COMPLETIONS: Completion[] = [
  { label: "fade",  type: "enum", detail: "黒からフェードイン" },
  { label: "white", type: "enum", detail: "白からフェードイン" },
];

// Inline text style tags (used inside say/narration text).
const STYLE_TAGS: Completion[] = [
  { label: "{red}", type: "keyword", detail: "赤" },
  { label: "{blue}", type: "keyword", detail: "青" },
  { label: "{yellow}", type: "keyword", detail: "黄" },
  { label: "{green}", type: "keyword", detail: "緑" },
  { label: "{cyan}", type: "keyword", detail: "シアン" },
  { label: "{orange}", type: "keyword", detail: "オレンジ" },
  { label: "{purple}", type: "keyword", detail: "紫" },
  { label: "{gray}", type: "keyword", detail: "グレー" },
  { label: "{white}", type: "keyword", detail: "白" },
  { label: "{big}", type: "keyword", detail: "大きい文字 (1.3em)" },
  { label: "{small}", type: "keyword", detail: "小さい文字 (0.75em)" },
  { label: "{/}", type: "keyword", detail: "スタイル終了" },
];

function makeCompletionSource(data: CompletionData) {
  return (ctx: CompletionContext) => {
    const line = ctx.state.doc.lineAt(ctx.pos);
    const lineText = line.text;
    const cursorInLine = ctx.pos - line.from;
    const textBefore = lineText.slice(0, cursorInLine);
    const trimmed = textBefore.trimStart();

    // strip comments
    const commentIdx = textBefore.indexOf("#");
    if (commentIdx !== -1 && commentIdx < textBefore.length) return null;

    // {style} tags inside say/narration text — triggered anywhere on the line
    const braceMatch = textBefore.match(/\{([^}]*)$/);
    if (braceMatch) {
      const typed = braceMatch[1];
      return {
        from: ctx.pos - typed.length - 1, // include the opening {
        options: STYLE_TAGS,
        validFor: /^\{[^}]*$/,
      };
    }

    // @effect
    if (trimmed.startsWith("@")) {
      const typed = trimmed.slice(1);
      return {
        from: ctx.pos - typed.length,
        options: EFFECTS,
        validFor: /^\w*$/,
      };
    }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0] ?? "";
    const wordStart = line.from + textBefore.length - (parts[parts.length - 1]?.length ?? 0);

    // Row start — suggest commands
    if (parts.length <= 1 && !textBefore.endsWith(" ")) {
      return {
        from: line.from + (textBefore.length - trimmed.length),
        options: COMMANDS,
        validFor: /^[\w@\->]*$/,
      };
    }

    // show / hide — 2nd token = character key
    if ((cmd === "show" || cmd === "hide") && parts.length === 2) {
      return {
        from: wordStart,
        options: data.characterKeys.map((k) => ({ label: k, type: "variable" })),
        validFor: /^\w*$/,
      };
    }

    // show <char> — 3rd token = position
    if (cmd === "show" && parts.length === 3) {
      return { from: wordStart, options: POSITIONS, validFor: /^\w*$/ };
    }

    // bg — 2nd token = bg asset ID
    if (cmd === "bg" && parts.length === 2) {
      return {
        from: wordStart,
        options: data.assetIds.map((id) => ({ label: id, type: "variable" })),
        validFor: /^\w*$/,
      };
    }

    // bgm — 2nd token = audio asset ID or off
    if (cmd === "bgm" && parts.length === 2) {
      const opts = [
        { label: "off", type: "keyword", detail: "BGM停止" },
        ...data.assetIds.map((id) => ({ label: id, type: "variable" })),
      ];
      return { from: wordStart, options: opts, validFor: /^\w*$/ };
    }

    // se — 2nd token = audio asset ID
    if (cmd === "se" && parts.length === 2) {
      return {
        from: wordStart,
        options: data.assetIds.map((id) => ({ label: id, type: "variable" })),
        validFor: /^\w*$/,
      };
    }

    // jump — 2nd token = scene ID
    if (cmd === "jump" && parts.length === 2) {
      return {
        from: wordStart,
        options: data.sceneIds.map((id) => ({ label: id, type: "variable" })),
        validFor: /^\w*$/,
      };
    }

    // jump <sceneId> — 3rd token = transition (optional)
    if (cmd === "jump" && parts.length === 3) {
      return { from: wordStart, options: TRANSITION_COMPLETIONS, validFor: /^\w*$/ };
    }

    // -> <text> : <sceneId> — after the colon
    if (trimmed.startsWith("->")) {
      const colonIdx = textBefore.lastIndexOf(":");
      if (colonIdx !== -1 && colonIdx > textBefore.indexOf("->") + 1) {
        const afterColon = textBefore.slice(colonIdx + 1).trim();
        const afterParts = afterColon.split(/\s+/);
        // 2nd token after colon = transition
        if (afterParts.length === 2 && !textBefore.endsWith(" ")) {
          return { from: wordStart, options: TRANSITION_COMPLETIONS, validFor: /^\w*$/ };
        }
        // 1st token after colon = scene ID
        return {
          from: ctx.pos - (afterParts[afterParts.length - 1]?.length ?? 0),
          options: data.sceneIds.map((id) => ({ label: id, type: "variable" })),
          validFor: /^\w*$/,
        };
      }
    }

    return null;
  };
}

// ---------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------

export function vnLanguage(data: CompletionData) {
  return [
    vnTheme,
    vnHighlightStyle,
    highlightPlugin,
    autocompletion({
      override: [makeCompletionSource(data)],
      activateOnTyping: true,
      maxRenderedOptions: 20,
    }),
  ];
}
