import type { Evidence } from "@dksi/spec-core";

export type AnswerPart = { kind: "text"; text: string } | { kind: "citation"; sourceIndex: number; source: Evidence };
/** Only exact IDs present in this response can become navigation links. */
export function splitAnswerCitations(answer: string, sources: Evidence[]): AnswerPart[] {
  const parts: AnswerPart[] = [];
  const expression = /\[(SRC:[^\[\]\r\n]+)\]/g;
  let cursor = 0;
  for (const match of answer.matchAll(expression)) {
    const index = match.index;
    if (index > cursor) parts.push({ kind: "text", text: answer.slice(cursor, index) });
    const sourceIndex = sources.findIndex(source => source.citationId === match[1]);
    if (sourceIndex >= 0) parts.push({ kind: "citation", sourceIndex, source: sources[sourceIndex] });
    else parts.push({ kind: "text", text: match[0] });
    cursor = index + match[0].length;
  }
  if (cursor < answer.length) parts.push({ kind: "text", text: answer.slice(cursor) });
  return parts;
}
