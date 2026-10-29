"use client";
import "./spec-overview.css";
import { useState } from "react";
import type { ScenarioDefinition, ScenarioResult } from "@dksi/spec-core";
import { uiText } from "../content/ui-text";

const text = uiText.overview.scenario;
const icon = { ok: "✓", no: "✕", go: "→" } as const;
/** Looks up a precomputed result for the chosen conditions. The rules themselves live in a reviewed data file, not here. */
export function ScenarioSimulator({ factors, review, table }: { factors: ScenarioDefinition["factors"]; review: ScenarioDefinition["review"]; table: Record<string, ScenarioResult> }) {
  const [inputs, setInputs] = useState<Record<string, string>>(() => Object.fromEntries(factors.map(factor => [factor.id, factor.default])));
  const result = table[factors.map(factor => inputs[factor.id]).join("|")];
  const reviewStatus = (text.reviewStatus as Record<string, string>)[review.status] ?? review.status;
  return <div className="scenario">
    <p className="review-note"><strong>{text.reviewPrefix}</strong> <span className={`review-badge ${review.status}`}>{reviewStatus}</span> {review.note}</p>
    <div className="scenario-controls" role="group" aria-label={text.controlsLabel}>{factors.map(factor => <label key={factor.id}>
      <span>{factor.label}</span>
      <select value={inputs[factor.id]} onChange={event => setInputs({ ...inputs, [factor.id]: event.target.value })}>
        {factor.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}</div>
    {result && <div className="scenario-result" aria-live="polite">
      <h3>{text.stepsHeading}</h3>
      <ol className="scenario-steps">{result.items.map((item, index) => <li key={index} className={item.kind}>
        <span className="step-icon" aria-hidden="true">{icon[item.kind]}</span>
        <span>{item.text}{item.refs.length > 0 && <span className="step-refs"><span className="sr-only">{text.refsLabel}: </span>
          {item.refs.map(ref => <code key={ref.citationId} title={ref.heading}>{ref.requirementId}</code>)}</span>}</span></li>)}</ol>
      <h3>{text.verdictHeading}</h3>
      <div className="verdicts">{result.verdicts.map(verdict => <div key={verdict.flag} className={`verdict ${verdict.allowed ? "yes" : "no"}`}>
        <strong>{verdict.label} {verdict.value}</strong><small>{verdict.note}</small></div>)}</div>
    </div>}
    <p className="overview-note">{text.disclaimer}</p>
  </div>;
}
