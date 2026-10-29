import type { Evidence } from "@dksi/spec-core";

/** `start`/`end` are offsets of the trimmed sentence inside the original answer string. */
export type UncitedSentence = { text: string; start: number; end: number };
export type AnswerAudit = { citedIds: string[]; uncited: UncitedSentence[] };
const CITATION = /\[(SRC:[^\[\]\r\n]+)\]/g;
const BULLET = /^\s*[-•*]\s+/;
/**
 * Mechanical audit of an answer that already passed the server's citation check. It only reports which sentences carry no
 * citation marker (so the model's own summary or interpretation); it cannot tell whether a cited sentence is logically supported.
 */
export function auditAnswer(answer: string, sources: readonly Evidence[]): AnswerAudit {
  const known = new Set(sources.map(source => source.citationId));
  const citedIds = [...new Set([...answer.matchAll(CITATION)].map(match => match[1]).filter(id => known.has(id)))];
  const units: (UncitedSentence & { cited: boolean })[] = [];
  for (const line of answer.matchAll(/[^\n]+/g)) {
    const bullet = BULLET.exec(line[0])?.[0].length ?? 0;
    const content = line[0].slice(bullet);
    for (const piece of content.matchAll(/\S[\s\S]*?(?:[.!?](?=\s|$)|$)/g)) {
      const raw = piece[0].trimEnd();
      const text = raw.replace(CITATION, "").replace(/\s+/g, " ").trim();
      const cited = new RegExp(CITATION.source).test(raw);
      if (!/[\p{L}\p{N}]/u.test(text)) {
        // A citation (or stray punctuation) standing alone belongs to the sentence before it.
        if (cited && units.length) units[units.length - 1].cited = true;
        continue;
      }
      const start = line.index + bullet + piece.index;
      units.push({ text, start, end: start + raw.length, cited });
    }
  }
  return { citedIds, uncited: units.filter(unit => !unit.cited).map(({ text, start, end }) => ({ text, start, end })) };
}
