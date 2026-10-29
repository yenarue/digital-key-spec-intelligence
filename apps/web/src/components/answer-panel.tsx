"use client";
import type { MouseEvent } from "react";
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
export function AnswerPanel({ result, mode = "ai" }: { result: AskResponse; mode?: SearchMode }) {
  const keywordResult = mode === "keyword" && result.status === "search_only";
  const groups = groupEvidence(result.sources);
  return <section className="answer-panel" aria-labelledby="answer-heading">
    <div className="section-title"><h2 id="answer-heading">{keywordResult ? text.keywordResultHeading : text.labels[result.status]}</h2></div>
    {result.status === "answered" && result.answer && <div className="answer-prose">{result.answer.split(/\n{2,}/).map((paragraph, paragraphIndex) => <p className="answer-text" key={paragraphIndex}>
      {splitAnswerCitations(paragraph, result.sources).map((part, index) => {
        if (part.kind === "text") return part.text;
        const targetId = evidenceTargetId(part.source.citationId);
        const groupIndex = groups.findIndex(group => group.items.includes(part.source));
        const label = groups[groupIndex].items.length > 1 ? text.citationLabelVersion : text.citationLabel;
        return <a key={index} className="citation-link" href={`#${targetId}`}
          aria-label={fill(text.citationAria, { n: groupIndex + 1, version: part.source.version, requirementId: part.source.requirementId })}
          onClick={event => focusEvidence(event, targetId)}>{fill(label, { n: groupIndex + 1, version: part.source.version })}<span aria-hidden="true"> ↗</span></a>;
      })}
    </p>)}</div>}
    {result.status === "search_only" && <p className="fallback-copy">{keywordResult ? text.searchOnlyKeyword : text.searchOnlyAi}</p>}
    {result.status === "llm_unavailable" && <p className="fallback-copy">{text.llmUnavailable}</p>}
    {result.status === "insufficient_evidence" && <p className="fallback-copy">{text.insufficientEvidence}</p>}
    {result.warnings.length > 0 && <ul className="result-warnings">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
    {result.status === "answered" && result.answer ? <AnswerVerification answer={result.answer} sources={result.sources} /> : <p className="evidence-caveat">{text.caveat}</p>}
  </section>;
}
