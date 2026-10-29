import type { Evidence } from "@dksi/spec-core";

export type AnswerAudit = { citedIds: string[]; uncited: string[] };
const CITATION = /\[(SRC:[^\[\]\r\n]+)\]/g;
/**
 * Mechanical audit of an answer that already passed the server's citation check. It only reports which sentences carry no
 * citation marker (so the model's own summary or interpretation); it cannot tell whether a cited sentence is logically supported.
 */
export function auditAnswer(answer: string, sources: readonly Evidence[]): AnswerAudit {
  const known = new Set(sources.map(source => source.citationId));
  const citedIds = [...new Set([...answer.matchAll(CITATION)].map(match => match[1]).filter(id => known.has(id)))];
  const units: { text: string; cited: boolean }[] = [];
  for (const line of answer.split(/\n+/)) {
    for (const piece of line.replace(/^\s*[-•*]\s+/, "").split(/(?<=[.!?])\s+/)) {
      const text = piece.replace(CITATION, "").replace(/\s+/g, " ").trim();
      const cited = new RegExp(CITATION.source).test(piece);
      if (!/[\p{L}\p{N}]/u.test(text)) {
        // A citation (or stray punctuation) standing alone belongs to the sentence before it.
        if (cited && units.length) units[units.length - 1].cited = true;
        continue;
      }
      units.push({ text, cited });
    }
  }
  return { citedIds, uncited: units.filter(unit => !unit.cited).map(unit => unit.text) };
}
