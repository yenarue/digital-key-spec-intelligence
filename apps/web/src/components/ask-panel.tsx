"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { AskResponse, SearchMode } from "../contracts/ask";
import { askQuestion, questionError, questionLength } from "../client/ask-client";
import { addHistory, clearHistory, historyStore, removeHistory, type HistoryEntry } from "../client/history";
import { EvidenceCard } from "./evidence-card";
import { AnswerPanel } from "./answer-panel";
import { SearchProgress } from "./search-progress";
import { QuestionHistory, savedTime, scopeLabel } from "./question-history";
import { fill, uiText } from "../content/ui-text";
import webPackage from "../../package.json";

type Scope = "all" | "V1" | "V2";
// `saved` marks a snapshot restored from browser history rather than a fresh response.
type SearchRun = { question: string; scope: Scope; mode: SearchMode; response: AskResponse; saved?: { id: string; at: string; appVersion: string } };
const text = uiText.search;
const historyText = uiText.history;
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
  const history = useSyncExternalStore(historyStore.subscribe, historyStore.getSnapshot, historyStore.getServerSnapshot);
  const form = useRef<HTMLFormElement>(null);
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
  function openHistory(entry: HistoryEntry) {
    if (activeRequest.current) return;
    const nextScope: Scope = entry.versions.length > 1 ? "all" : entry.versions[0];
    setQuestion(entry.question); setScope(nextScope); setMode(entry.mode); setError(null); setReused(false);
    setResults({ [entry.mode]: { question: entry.question, scope: nextScope, mode: entry.mode, response: entry.response,
      saved: { id: entry.id, at: entry.submittedAt, appVersion: entry.appVersion } } });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeRequest.current) return;
    const validation = questionError(question);
    if (validation) { setError(validation); input.current?.focus(); return; }
    const controller = new AbortController();
    activeRequest.current = controller;
    const snapshot = { question: question.trim(), scope, mode };
    const versions: HistoryEntry["versions"] = snapshot.scope === "all" ? ["V1", "V2"] : [snapshot.scope];
    setPending(true); setError(null); setReused(false);
    setResults(previous => {
      const next = { ...previous };
      delete next[snapshot.mode];
      return next;
    });
    try {
      const response = await askQuestion({ question: snapshot.question, versions, topK: 5, mode: snapshot.mode }, { signal: controller.signal });
      if (activeRequest.current === controller) {
        setResults(previous => ({ ...previous, [snapshot.mode]: { ...snapshot, response } }));
        historyStore.set(addHistory({ question: snapshot.question, mode: snapshot.mode, versions, topK: 5,
          submittedAt: new Date().toISOString(), appVersion: webPackage.version, response }));
      }
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
    <form ref={form} className="search-form" onSubmit={submit} aria-busy={pending} noValidate>
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
      <label className="question-label visually-hidden" htmlFor="question">{text.questionLabel}</label>
      <div className={`question-composer${error ? " has-error" : ""}`}>
        <textarea id="question" ref={input} value={question} onChange={event => updateInput(event.target.value)}
          onKeyDown={shortcut} disabled={pending} rows={3} aria-invalid={error ? true : undefined}
          aria-describedby={error ? "question-hint question-error" : "question-hint"}
          placeholder={text.placeholder} />
        <div className="composer-bottom"><span id="question-hint">{text.inputHint}</span>
          <div className="composer-actions"><span className={questionLength(question) > 500 ? "character-count too-long" : "character-count"}>{questionLength(question)}/500</span>
            <button className="primary-button" disabled={pending} type="submit">{pending ? text.submitPending : text.submit}</button></div></div>
      </div>
      {error && <p className="input-error" id="question-error" role="alert">{error}</p>}
      <div className="examples"><span>{text.examplesLabel}</span>{examples.map(example => <button type="button" key={example.label} disabled={pending}
        onClick={() => { updateInput(example.question, example.scope); input.current?.focus(); }}>{example.label}</button>)}</div>
    </form>
    <QuestionHistory entries={history} disabled={pending} currentId={submitted?.saved?.id} onOpen={openHistory}
      onRemove={id => historyStore.set(removeHistory(id))} onClear={() => historyStore.set(clearHistory())} />
    <p className="search-status" role="status" aria-live="polite">{pending ? (mode === "keyword" ? text.statusPendingKeyword : text.statusPendingAi) : result ? `${submitted?.saved ? historyText.statusSaved : reused ? text.statusReused : text.statusDone} ${fill(submitted?.mode === "keyword" ? text.statusCountKeyword : text.statusCount, { count: result.sources.length })}` : ""}</p>
    {pending && <SearchProgress mode={mode} />}
    {!pending && result && <div className="result-block">
      {submitted?.saved && <div className="saved-banner"><strong>{historyText.savedLabel}</strong>
        <span>{savedTime(submitted.saved.at)} · {modeLabels[submitted.mode]} · {scopeLabel(submitted.scope === "all" ? ["V1", "V2"] : [submitted.scope])}</span>
        <button type="button" onClick={() => form.current?.requestSubmit()}><span aria-hidden="true">↻ </span>{historyText.rerun}</button>
        {submitted.saved.appVersion !== webPackage.version && <p>{historyText.versionMismatch}</p>}</div>}
      <div className="result-context"><span>{reused && <><span className="cached-result">{text.contextReused}</span> · </>}{submitted && modeLabels[submitted.mode]}{submitted?.mode === "ai" && (result.status === "llm_unavailable" || result.status === "search_only") ? ` · ${text.contextAiFallback}` : ""} · {submitted?.scope === "all" ? text.contextScopeAll : submitted?.scope} {text.contextScopeSuffix}</span>
        <span>{text.contextQuestion} {submitted?.question}</span></div>
      <div className={`results-grid${result.sources.length ? "" : " no-sources"}`}>
        <AnswerPanel result={result} mode={submitted?.mode} />
        {result.sources.length > 0 && <section className="sources-panel" aria-labelledby="sources-heading"><div className="section-title"><h2 id="sources-heading">{submitted?.mode === "keyword" ? text.sourcesHeadingKeyword : text.sourcesHeading}<span className="source-count">{result.sources.length}</span></h2><span>{text.sourcesSubtitle}</span></div>
          {result.sources.map((source, index) => <EvidenceCard key={source.citationId} evidence={source} index={index} />)}</section>}
      </div>
    </div>}
    {!pending && !result && !error && <div className="first-visit"><span className="empty-rule" /><h2>{text.firstVisitHeading}</h2><p>{text.firstVisitLine1}<br />{text.firstVisitLine2}</p></div>}
  </div>;
}
