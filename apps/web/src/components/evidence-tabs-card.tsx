"use client";
import "./evidence-tabs-card.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Evidence } from "@dksi/spec-core";
import { diffWords } from "../client/diff";
import { fill, uiText } from "../content/ui-text";
import { evidenceTargetId, Highlighted } from "./evidence-card";

const text = uiText.evidence;
/** One requirement that exists in several versions: one card, one tab per version. Every version's panel stays in the DOM (hidden) so citation links can still find it. */
export function EvidenceTabsCard({ items, index }: { items: Evidence[]; index: number }) {
  const [active, setActive] = useState(items.length - 1); // latest version first
  const [showChanges, setShowChanges] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const card = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = evidenceTargetId(items[0].citationId);
  const current = items[active];
  const diff = useMemo(() => items.length > 1 ? diffWords(items[0].fullText, items[items.length - 1].fullText) : null, [items]);
  useEffect(() => {
    const element = card.current;
    const open = (event: Event) => {
      const next = items.findIndex(item => evidenceTargetId(item.citationId) === (event as CustomEvent<string>).detail);
      if (next >= 0) setActive(next);
    };
    element?.addEventListener("select-evidence", open);
    return () => element?.removeEventListener("select-evidence", open);
  }, [items]);
  function move(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = (active + (event.key === "ArrowRight" ? 1 : items.length - 1)) % items.length;
    setActive(next);
    tabs.current[next]?.focus();
  }
  return <article ref={card} className="evidence-card evidence-tabs" id={`${baseId}-group`} tabIndex={-1} aria-labelledby={`${baseId}-heading`}>
    <div className="source-meta"><span className="source-number">{String(index + 1).padStart(2, "0")}</span>
      <div className="version-tabs" role="tablist" aria-label={text.tabsLabel}>{items.map((item, position) => <button key={item.citationId} type="button" role="tab"
        ref={element => { tabs.current[position] = element; }} id={`${evidenceTargetId(item.citationId)}-tab`} aria-selected={position === active}
        aria-controls={evidenceTargetId(item.citationId)} tabIndex={position === active ? 0 : -1} onClick={() => setActive(position)} onKeyDown={move}>{item.version}</button>)}</div>
      <span>§{current.sectionId}</span>
      {diff && <label className="change-toggle"><input type="checkbox" checked={showChanges} onChange={event => setShowChanges(event.target.checked)} />
        <span>{text.highlightChanges}</span><span className="change-count">{fill(text.changeCountShort, { count: diff.changes })}</span></label>}
    </div>
    <h3 id={`${baseId}-heading`}>{current.heading ?? current.requirementId}</h3>
    <p className="document-title">{current.documentTitle}</p>
    {items.map((item, position) => {
      const matches = (item.matches ?? []).filter(match => typeof match?.term === "string" && match.term.length > 0);
      const side = position === 0 ? diff?.from : diff?.to;
      return <div key={item.citationId} role="tabpanel" id={evidenceTargetId(item.citationId)} aria-labelledby={`${evidenceTargetId(item.citationId)}-tab`} hidden={position !== active}>
        <code className="requirement-id">{item.requirementId}</code>
        {showChanges && side
          ? <blockquote lang="en" className="changes-view" aria-label={fill(text.changeLegend, { version: item.version, other: items[position === 0 ? items.length - 1 : 0].version })}>
            {side.map((part, partIndex) => part.changed ? (position === 0 ? <del key={partIndex}>{part.text}</del> : <ins key={partIndex}>{part.text}</ins>) : part.text)}</blockquote>
          : <blockquote lang="en"><Highlighted text={item.quote} evidence={item} /></blockquote>}
        {matches.length > 0 && !showChanges && <div className="matched-terms"><span>{text.matchedTerms}</span>
          <ul aria-label={text.matchedTerms}>{matches.map(match => <li key={match.term} lang="en">{match.term}
            {match.viaSynonym && <span className="synonym-tag" lang="ko">{text.synonymTag}</span>}</li>)}</ul></div>}
        <details onToggle={event => setExpanded(event.currentTarget.open)}>
          <summary>{expanded ? text.collapse : text.expand}</summary>
          <div className="source-full"><p lang="en"><Highlighted text={item.fullText} evidence={item} /></p>
            <dl><div><dt>{text.documentId}</dt><dd>{item.documentId}</dd></div>
              <div><dt>{text.citationId}</dt><dd><code>{item.citationId}</code></dd></div></dl>
          </div>
        </details>
      </div>;
    })}
  </article>;
}
