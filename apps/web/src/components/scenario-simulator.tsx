"use client";
import "./spec-overview.css";
import { useEffect, useState } from "react";
import type { ScenarioDefinition, ScenarioRef, ScenarioResult } from "@dksi/spec-core";
import { fill, uiText } from "../content/ui-text";

const text = uiText.overview.scenario;
const icon = { ok: "✓", no: "✕", go: "→" } as const;
export type ScenarioSource = { requirementId: string; version: string; sectionId: string; heading: string; text: string };
type Selection = { id: string; ref: ScenarioRef };
/** Looks up a precomputed result for the chosen conditions. The rules themselves live in a reviewed data file, not here. */
export function ScenarioSimulator({ factors, review, table, sources }: {
  factors: ScenarioDefinition["factors"]; review: ScenarioDefinition["review"]; table: Record<string, ScenarioResult>; sources: Record<string, ScenarioSource>;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>(() => Object.fromEntries(factors.map(factor => [factor.id, factor.default])));
  const [selected, setSelected] = useState<Selection | null>(null);
  const result = table[factors.map(factor => inputs[factor.id]).join("|")];
  const reviewStatus = (text.reviewStatus as Record<string, string>)[review.status] ?? review.status;
  const source = selected ? sources[selected.ref.citationId] : undefined;
  useEffect(() => {
    if (!selected) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selected]);
  return <div className="scenario">
    <p className="review-note"><strong>{text.reviewPrefix}</strong> <span className={`review-badge ${review.status}`}>{reviewStatus}</span> {review.note}</p>
    <div className="scenario-layout">
      <div className="scenario-main">
        <div className="scenario-controls" role="group" aria-label={text.controlsLabel}>{factors.map(factor => <label key={factor.id}>
          <span>{factor.label}</span>
          <select value={inputs[factor.id]} onChange={event => { setInputs({ ...inputs, [factor.id]: event.target.value }); setSelected(null); }}>
            {factor.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}</div>
        {result && <div className="scenario-result" aria-live="polite">
          <h3>{text.stepsHeading}</h3>
          <p className="steps-note">{text.stepsNote}</p>
          <ol className="scenario-steps">{result.items.map((item, index) => <li key={index} className={item.kind}>
            <span className="step-icon" aria-hidden="true">{icon[item.kind]}</span>
            <span>{item.text}{item.refs.length > 0 && <span className="step-refs"><span className="sr-only">{text.refsLabel}: </span>
              {item.refs.map((ref, refIndex) => { const id = `${index}-${refIndex}`; return <button key={id} type="button" className="ref-button" aria-pressed={selected?.id === id}
                title={fill(text.refTitle, { heading: ref.heading })} onClick={() => setSelected(selected?.id === id ? null : { id, ref })}>{ref.requirementId}</button>; })}</span>}</span></li>)}</ol>
          <h3>{text.verdictHeading}</h3>
          <div className="verdicts">{result.verdicts.map(verdict => <div key={verdict.flag} className={`verdict ${verdict.allowed ? "yes" : "no"}`}>
            <strong>{verdict.label} {verdict.value}</strong><small>{verdict.note}</small></div>)}</div>
        </div>}
      </div>
      <aside className={`source-panel${selected ? " open" : ""}`} aria-label={text.sourceTitle}>
        <div className="source-panel-head"><h3>{text.sourceTitle}</h3>
          {selected && <button type="button" className="source-close" onClick={() => setSelected(null)}>{text.sourceClose}</button>}</div>
        {selected && source ? <div aria-live="polite">
          <p className="source-id"><code>{source.requirementId}</code> {source.version} · §{source.sectionId}</p>
          <p className="source-heading">{source.heading}</p>
          <p className="source-text" lang="en">{source.text.slice(0, selected.ref.start)}<mark>{source.text.slice(selected.ref.start, selected.ref.end)}</mark>{source.text.slice(selected.ref.end)}</p>
          <p className="source-hint">{text.sourceHint}</p></div> : <p className="source-empty">{text.sourceEmpty}</p>}
      </aside>
    </div>
    <p className="overview-note">{text.disclaimer}</p>
  </div>;
}
