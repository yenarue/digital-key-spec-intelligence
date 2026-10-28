"use client";
import { useState } from "react";
import type { Evidence } from "@dksi/spec-core";
import { uiText } from "../content/ui-text";

const text = uiText.evidence;

export function evidenceTargetId(citationId: string) { return `source-${citationId.replaceAll(":", "-")}`; }
export function EvidenceCard({ evidence, index }: { evidence: Evidence; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const id = evidenceTargetId(evidence.citationId);
  return <article className="evidence-card" id={id} tabIndex={-1} aria-labelledby={`${id}-heading`}>
    <div className="source-meta"><span className="source-number">{String(index + 1).padStart(2, "0")}</span>
      <span>{evidence.version} <span aria-hidden="true">·</span> §{evidence.sectionId}</span></div>
    <h3 id={`${id}-heading`}>{evidence.heading ?? evidence.requirementId}</h3>
    <p className="document-title">{evidence.documentTitle}</p>
    <code className="requirement-id">{evidence.requirementId}</code>
    <blockquote lang="en">{evidence.quote}</blockquote>
    <details onToggle={event => setExpanded(event.currentTarget.open)}>
      <summary>{expanded ? text.collapse : text.expand}</summary>
      <div className="source-full"><p lang="en">{evidence.fullText}</p>
        <dl><div><dt>{text.documentId}</dt><dd>{evidence.documentId}</dd></div>
          <div><dt>{text.citationId}</dt><dd><code>{evidence.citationId}</code></dd></div></dl>
      </div>
    </details>
  </article>;
}
