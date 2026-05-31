/** A run of text with optional inline styling. */
export interface TextSegment {
  text: string;
  color?: string; // CSS color value
  em?: number;    // font-size multiplier (e.g. 1.3, 0.75)
}

const NAMED_COLORS: Record<string, string> = {
  red:    "#ef4444",
  blue:   "#60a5fa",
  yellow: "#facc15",
  green:  "#4ade80",
  cyan:   "#22d3ee",
  orange: "#fb923c",
  purple: "#c084fc",
  gray:   "#9ca3af",
  white:  "#ffffff",
};

function applyRules(tag: string): Pick<TextSegment, "color" | "em"> {
  const result: Pick<TextSegment, "color" | "em"> = {};
  for (const rule of tag.split(",").map((r) => r.trim())) {
    if (NAMED_COLORS[rule]) {
      result.color = NAMED_COLORS[rule];
    } else if (/^#[0-9a-fA-F]{3,6}$/.test(rule)) {
      result.color = rule;
    } else if (rule === "big") {
      result.em = 1.3;
    } else if (rule === "small") {
      result.em = 0.75;
    }
  }
  return result;
}

/**
 * Parse a DSL text string containing optional inline markup into segments.
 *
 * Syntax: `{rule[,rule...]}text{/}` — comma-separated rules, close tag is always `{/}`.
 * Multiple rules per tag are supported (e.g. `{red,big}` applies color AND size).
 * Nesting is not supported. Unknown rules are silently ignored.
 *
 * Example: `これは{red,big}重要{/}なテキストです。`
 */
export function parseRichText(raw: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Match {tag}content{/} — non-greedy so adjacent tags work correctly.
  const TAG_RE = /\{([^/][^}]*)\}([\s\S]*?)\{\/\}/g;
  let lastIndex = 0;

  for (const match of raw.matchAll(TAG_RE)) {
    const [full, tag, content] = match;
    const start = match.index!;

    // Text before this tag
    if (start > lastIndex) {
      segments.push({ text: raw.slice(lastIndex, start) });
    }

    // Styled segment
    const style = applyRules(tag);
    if (content) segments.push({ text: content, ...style });

    lastIndex = start + full.length;
  }

  // Remaining text after last tag
  if (lastIndex < raw.length) {
    segments.push({ text: raw.slice(lastIndex) });
  }

  // If no tags found at all, return a single plain segment.
  return segments.length > 0 ? segments : [{ text: raw }];
}
