"use client";
import type { MouseEvent } from "react";
import type { AskResponse, SearchMode } from "../contracts/ask";
import { splitAnswerCitations } from "../client/answer-citations";
import { evidenceTargetId } from "./evidence-card";
import { fill, uiText } from "../content/ui-text";

const text = uiText.answer;
function focusEvidence(event: MouseEvent<HTMLAnchorElement>, targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  target.focus({ preventScroll: true });
}
export function AnswerPanel({ result, mode = "ai" }: { result: AskResponse; mode?: SearchMode }) {
  const keywordResult = mode === "keyword" && result.status === "search_only";
  return <section className="answer-panel" aria-labelledby="answer-heading">
    <div className="section-title"><h2 id="answer-heading">{keywordResult ? text.keywordResultHeading : text.labels[result.status]}</h2></div>
    {result.status === "answered" && result.answer && <div className="answer-prose">{result.answer.split(/\n{2,}/).map((paragraph, paragraphIndex) => <p className="answer-text" key={paragraphIndex}>
      {splitAnswerCitations(paragraph, result.sources).map((part, index) => {
        if (part.kind === "text") return part.text;
        const targetId = evidenceTargetId(part.source.citationId);
        return <a key={index} className="citation-link" href={`#${targetId}`}
          aria-label={fill(text.citationAria, { n: part.sourceIndex + 1, version: part.source.version, requirementId: part.source.requirementId })}
          onClick={event => focusEvidence(event, targetId)}>{fill(text.citationLabel, { n: part.sourceIndex + 1 })}<span aria-hidden="true"> ↗</span></a>;
      })}
    </p>)}</div>}
    {result.status === "search_only" && <p className="fallback-copy">{keywordResult ? text.searchOnlyKeyword : text.searchOnlyAi}</p>}
    {result.status === "llm_unavailable" && <p className="fallback-copy">{text.llmUnavailable}</p>}
    {result.status === "insufficient_evidence" && <p className="fallback-copy">{text.insufficientEvidence}</p>}
    {result.warnings.length > 0 && <ul className="result-warnings">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
    <p className="evidence-caveat">{text.caveat}</p>
  </section>;
}
