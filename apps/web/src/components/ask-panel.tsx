"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { AskResponse, SearchMode } from "../contracts/ask";
import { askQuestion, questionError, questionLength } from "../client/ask-client";
import { EvidenceCard } from "./evidence-card";
import { AnswerPanel } from "./answer-panel";
import { fill, uiText } from "../content/ui-text";

type Scope = "all" | "V1" | "V2";
type SearchRun = { question: string; scope: Scope; mode: SearchMode; response: AskResponse };
const text = uiText.search;
const modeLabels = text.modeLabels as Record<SearchMode, string>;
const examples = text.examples as { label: string; question: string; scope: Scope }[];
export function AskPanel() {
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [mode, setMode] = useState<SearchMode>("keyword");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only the current input is retained: at most one latest result per mode.
  const [results, setResults] = useState<Partial<Record<SearchMode, SearchRun>>>({});
  const [reused, setReused] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => { activeRequest.current?.abort(); }, []);
  const submitted = results[mode];
  const result = submitted?.response;
  function updateInput(value: string, nextScope: Scope = scope) {
    if (value.trim() !== question.trim() || nextScope !== scope) {
      setResults({});
      setReused(false);
    }
    setQuestion(value);
    setScope(nextScope);
    setError(null);
  }
  function selectMode(nextMode: SearchMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setReused(Boolean(results[nextMode]));
    setError(null);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeRequest.current) return;
    const validation = questionError(question);
    if (validation) { setError(validation); input.current?.focus(); return; }
    const controller = new AbortController();
    activeRequest.current = controller;
    const snapshot = { question: question.trim(), scope, mode };
    setPending(true); setError(null); setReused(false);
    setResults(previous => {
      const next = { ...previous };
      delete next[snapshot.mode];
      return next;
    });
    try {
      const response = await askQuestion({ question: snapshot.question, versions: snapshot.scope === "all" ? ["V1", "V2"] : [snapshot.scope], topK: 5, mode: snapshot.mode }, { signal: controller.signal });
      if (activeRequest.current === controller) setResults(previous => ({ ...previous, [snapshot.mode]: { ...snapshot, response } }));
    } catch (caught) {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : uiText.errors.generic);
    } finally {
      if (activeRequest.current === controller) { activeRequest.current = null; setPending(false); }
    }
  }
  function shortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); }
  }
  return <div className="ask-panel">
    <form onSubmit={submit} aria-busy={pending} noValidate>
      <div className="search-controls">
      <fieldset disabled={pending} className="version-options mode-options" aria-describedby="search-mode-hint"><legend>{text.modeLegend}</legend>
        <div className="version-control mode-control">{(["keyword", "ai"] as const).map(value => <label key={value}>
          <input type="radio" name="mode" value={value} checked={mode === value} onChange={() => selectMode(value)} />
          <span>{modeLabels[value]}</span></label>)}</div></fieldset>
      <fieldset disabled={pending} className="version-options"><legend>{text.versionLegend}</legend>
        <div className="version-control">{(["all", "V1", "V2"] as const).map(version => <label key={version}>
          <input type="radio" name="version" value={version} checked={scope === version} onChange={() => updateInput(question, version)} />
          <span>{version === "all" ? text.versionAll : version}</span></label>)}</div></fieldset>
      </div>
      <p className="mode-hint" id="search-mode-hint">{text.modeHints[mode]}</p>
      <label className="question-label" htmlFor="question">{text.questionLabel}</label>
      <div className={`question-composer${error ? " has-error" : ""}`}>
        <textarea id="question" ref={input} value={question} onChange={event => updateInput(event.target.value)}
          onKeyDown={shortcut} disabled={pending} rows={3} aria-invalid={error ? true : undefined}
          aria-describedby={error ? "question-hint question-error" : "question-hint"}
          placeholder={text.placeholder} />
        <div className="composer-bottom"><span id="question-hint">{text.inputHint}</span>
          <div className="composer-actions"><span className={questionLength(question) > 500 ? "character-count too-long" : "character-count"}>{questionLength(question)}/500</span>
            <button className="primary-button" disabled={pending} type="submit">{pending ? text.submitPending : text.submit}<span aria-hidden="true"> ↗</span></button></div></div>
      </div>
      {error && <p className="input-error" id="question-error" role="alert">{error}</p>}
      <div className="examples"><span>{text.examplesLabel}</span>{examples.map(example => <button type="button" key={example.label} disabled={pending}
        onClick={() => { updateInput(example.question, example.scope); input.current?.focus(); }}>{example.label}<span aria-hidden="true"> ↗</span></button>)}</div>
    </form>
    <p className="search-status" role="status" aria-live="polite">{pending ? (mode === "keyword" ? text.statusPendingKeyword : text.statusPendingAi) : result ? `${reused ? text.statusReused : text.statusDone} ${fill(text.statusCount, { count: result.sources.length })}` : ""}</p>
    {pending && <div className="loading-skeleton" aria-hidden="true"><div /><div /><div /></div>}
    {!pending && result && <div className="result-block">
      <div className="result-context"><span>{reused && <><span className="cached-result">{text.contextReused}</span> · </>}{submitted && modeLabels[submitted.mode]}{submitted?.mode === "ai" && (result.status === "llm_unavailable" || result.status === "search_only") ? ` · ${text.contextAiFallback}` : ""} · {submitted?.scope === "all" ? text.contextScopeAll : submitted?.scope} {text.contextScopeSuffix}</span>
        <span>{text.contextQuestion} {submitted?.question}</span></div>
      <div className={`results-grid${result.sources.length ? "" : " no-sources"}`}>
        <AnswerPanel result={result} mode={submitted?.mode} />
        {result.sources.length > 0 && <section className="sources-panel" aria-labelledby="sources-heading"><div className="section-title"><h2 id="sources-heading">{text.sourcesHeading} <span className="source-count">{result.sources.length}</span></h2><span>{text.sourcesSubtitle}</span></div>
          {result.sources.map((source, index) => <EvidenceCard key={source.citationId} evidence={source} index={index} />)}</section>}
      </div>
    </div>}
    {!pending && !result && !error && <div className="first-visit"><span className="empty-rule" /><h2>{text.firstVisitHeading}</h2><p>{text.firstVisitLine1}<br />{text.firstVisitLine2}</p></div>}
  </div>;
}
