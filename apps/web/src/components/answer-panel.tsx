"use client";
import type { MouseEvent } from "react";
import type { AskResponse } from "../contracts/ask";
import { splitAnswerCitations } from "../client/answer-citations";
import { evidenceTargetId } from "./evidence-card";

const labels = {
  answered: "근거 기반 답변",
  search_only: "검색 결과를 확인하세요",
  llm_unavailable: "AI 답변을 가져오지 못했어요",
  insufficient_evidence: "이 합성 문서에서 답변 근거를 찾지 못했어요",
};
function focusEvidence(event: MouseEvent<HTMLAnchorElement>, targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  target.focus({ preventScroll: true });
}
export function AnswerPanel({ result }: { result: AskResponse }) {
  return <section className="answer-panel" aria-labelledby="answer-heading">
    <div className="section-title"><h2 id="answer-heading">{labels[result.status]}</h2></div>
    {result.status === "answered" && result.answer && <div className="answer-prose">{result.answer.split(/\n{2,}/).map((paragraph, paragraphIndex) => <p className="answer-text" key={paragraphIndex}>
      {splitAnswerCitations(paragraph, result.sources).map((part, index) => {
        if (part.kind === "text") return part.text;
        const targetId = evidenceTargetId(part.source.citationId);
        return <a key={index} className="citation-link" href={`#${targetId}`}
          aria-label={`근거 ${part.sourceIndex + 1}: ${part.source.version} ${part.source.requirementId}`}
          onClick={event => focusEvidence(event, targetId)}>근거 {part.sourceIndex + 1}<span aria-hidden="true"> ↗</span></a>;
      })}
    </p>)}</div>}
    {result.status === "search_only" && <p className="fallback-copy">AI 답변 없이 검색된 근거를 보여드려요.</p>}
    {result.status === "llm_unavailable" && <p className="fallback-copy">검색된 근거는 아래에서 확인할 수 있어요. 필요하면 다시 질문해주세요.</p>}
    {result.status === "insufficient_evidence" && <p className="fallback-copy">다른 용어로 질문하거나 문서 버전을 바꿔보세요.</p>}
    {result.warnings.length > 0 && <ul className="result-warnings">{result.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
    <p className="evidence-caveat">인용과 원문 일치 확인은 답변의 논리적 정확성을 보장하지 않습니다.</p>
  </section>;
}
