"use client";
import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import type { AskResponse, SearchMode } from "../contracts/ask";
import { splitAnswerCitations } from "../client/answer-citations";
import { evidenceTargetId } from "./evidence-card";
import { groupEvidence } from "../client/group-evidence";
import { AnswerVerification } from "./answer-verification";
import { fill, uiText } from "../content/ui-text";

const text = uiText.answer;
function focusEvidence(event: MouseEvent<HTMLAnchorElement>, targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return;
  event.preventDefault();
  // A cited version can sit in an inactive tab: ask its card to open that tab, then focus the (always visible) card.
  const card = target.closest<HTMLElement>("article.evidence-card") ?? target;
  if (target.hidden) card.dispatchEvent(new CustomEvent("select-evidence", { detail: targetId }));
  card.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  card.focus({ preventScroll: true });
}
/** Marks the part of a text node that falls inside the hovered sentence span (offsets are into the whole answer). */
function withHover(value: string, from: number, span: [number, number] | null): ReactNode {
  if (!span) return value;
  const start = Math.max(span[0] - from, 0), end = Math.min(span[1] - from, value.length);
  if (start >= end) return value;
  return [value.slice(0, start), <mark key="hover" className="answer-hover">{value.slice(start, end)}</mark>, value.slice(end)];
}
export function AnswerPanel({ result, mode = "ai" }: { result: AskResponse; mode?: SearchMode }) {
  const keywordResult = mode === "keyword" && result.status === "search_only";
  const groups = groupEvidence(result.sources);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const paragraphs = [...(result.answer ?? "").matchAll(/(?:[^\n]|\n(?!\n))+/g)].map(match => ({ paragraph: match[0], start: match.index }));
  return <section className="answer-panel" aria-labelledby="answer-heading">
    <div className="section-title"><h2 id="answer-heading">{keywordResult ? text.keywordResultHeading : text.labels[result.status]}</h2></div>
    {result.status === "answered" && result.answer && <div className="answer-prose">{paragraphs.map(({ paragraph, start }, paragraphIndex) => { let offset = start; return <p className="answer-text" key={paragraphIndex}>
      {splitAnswerCitations(paragraph, result.sources).map((part, index) => {
        const from = offset;
        offset += part.kind === "text" ? part.text.length : part.source.citationId.length + 2;
        if (part.kind === "text") return <span key={index}>{withHover(part.text, from, hover)}</span>;
        const targetId = evidenceTargetId(part.source.citationId);
        const groupIndex = groups.findIndex(group => group.items.includes(part.source));
        const label = groups[groupIndex].items.length > 1 ? text.citationLabelVersion : text.citationLabel;
        return <a key={index} className="citation-link" href={`#${targetId}`}
          aria-label={fill(text.citationAria, { n: groupIndex + 1, version: part.source.version, requirementId: part.source.requirementId })}
          onClick={event => focusEvidence(event, targetId)}>{fill(label, { n: groupIndex + 1, version: part.source.version })}<span aria-hidden="true"> ↗</span></a>;
      })}
    </p>; })}</div>}
    {result.status === "search_only" && <p className="fallback-copy">{keywordResult ? text.searchOnlyKeyword : text.searchOnlyAi}</p>}
    {result.status === "llm_unavailable" && <p className="fallback-copy">{text.llmUnavailable}</p>}
    {result.status === "insufficient_evidence" && <p className="fallback-copy">{text.insufficientEvidence}</p>}
    {result.warnings.length > 0 && <ul className="result-warnings">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
    {result.status === "answered" && result.answer ? <AnswerVerification answer={result.answer} sources={result.sources} onHighlight={setHover} /> : <p className="evidence-caveat">{text.caveat}</p>}
  </section>;
}
