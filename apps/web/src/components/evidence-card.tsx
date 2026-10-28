"use client";
import { useState } from "react";
import type { Evidence } from "@dksi/spec-core";
import { highlightParts } from "../client/highlight";
import { uiText } from "../content/ui-text";

const text = uiText.evidence;

export function evidenceTargetId(citationId: string) { return `source-${citationId.replaceAll(":", "-")}`; }
function Highlighted({ text: value, evidence }: { text: string; evidence: Evidence }) {
  return highlightParts(value, evidence.fullText, evidence.matches).map((part, index) => part.marked ? <mark key={index}>{part.text}</mark> : part.text);
}
export function EvidenceCard({ evidence, index }: { evidence: Evidence; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const id = evidenceTargetId(evidence.citationId);
  const matches = (evidence.matches ?? []).filter(match => typeof match?.term === "string" && match.term.length > 0);
  return <article className="evidence-card" id={id} tabIndex={-1} aria-labelledby={`${id}-heading`}>
    <div className="source-meta"><span className="source-number">{String(index + 1).padStart(2, "0")}</span>
      <span>{evidence.version} <span aria-hidden="true">·</span> §{evidence.sectionId}</span></div>
    <h3 id={`${id}-heading`}>{evidence.heading ?? evidence.requirementId}</h3>
    <p className="document-title">{evidence.documentTitle}</p>
    <code className="requirement-id">{evidence.requirementId}</code>
    {matches.length > 0 && <div className="matched-terms"><span>{text.matchedTerms}</span>
      <ul aria-label={text.matchedTerms}>{matches.map(match => <li key={match.term} lang="en">{match.term}
        {match.viaSynonym && <span className="synonym-tag" lang="ko">{text.synonymTag}</span>}</li>)}</ul></div>}
    <blockquote lang="en"><Highlighted text={evidence.quote} evidence={evidence} /></blockquote>
    <details onToggle={event => setExpanded(event.currentTarget.open)}>
      <summary>{expanded ? text.collapse : text.expand}</summary>
      <div className="source-full"><p lang="en"><Highlighted text={evidence.fullText} evidence={evidence} /></p>
        <dl><div><dt>{text.documentId}</dt><dd>{evidence.documentId}</dd></div>
          <div><dt>{text.citationId}</dt><dd><code>{evidence.citationId}</code></dd></div></dl>
      </div>
    </details>
  </article>;
}
