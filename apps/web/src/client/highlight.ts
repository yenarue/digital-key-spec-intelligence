import type { MatchedTerm } from "@dksi/spec-core";

export type TextPart = { text: string; marked: boolean };
/** Marks server-matched ranges of fullText inside text; joining the parts always yields text unchanged. */
export function highlightParts(text: string, fullText: string, matches: readonly MatchedTerm[] = []): TextPart[] {
  const offset = fullText.indexOf(text);
  const spans: [number, number][] = [];
  if (offset >= 0) {
    for (const match of matches) {
      for (const range of Array.isArray(match?.ranges) ? match.ranges : []) {
        const [start, end] = Array.isArray(range) ? range : [NaN, NaN];
        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > fullText.length || start >= end) continue;
        const from = Math.max(start - offset, 0), to = Math.min(end - offset, text.length);
        if (from < to) spans.push([from, to]);
      }
    }
  }
  spans.sort((a, b) => a[0] - b[0]);
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const [from, to] of spans) {
    if (to <= cursor) continue;
    const start = Math.max(from, cursor);
    if (start > cursor) parts.push({ text: text.slice(cursor, start), marked: false });
    const last = parts.at(-1);
    if (last?.marked && start === cursor) last.text += text.slice(start, to);
    else parts.push({ text: text.slice(start, to), marked: true });
    cursor = to;
  }
  if (cursor < text.length || parts.length === 0) parts.push({ text: text.slice(cursor), marked: false });
  return parts;
}
