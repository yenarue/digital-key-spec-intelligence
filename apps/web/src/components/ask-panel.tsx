"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { AskResponse, SearchMode } from "../contracts/ask";
import { askQuestion, questionError, questionLength } from "../client/ask-client";
import { EvidenceCard } from "./evidence-card";
import { AnswerPanel } from "./answer-panel";

type Scope = "all" | "V1" | "V2";
type SearchRun = { question: string; scope: Scope; mode: SearchMode; response: AskResponse };
const modeLabels: Record<SearchMode, string> = { keyword: "키워드 검색", ai: "AI 검색" };
const examples: { label: string; question: string; scope: Scope }[] = [
  { label: "위임 공유", question: "V1과 V2에서 friend device의 재공유 규칙은 어떻게 다른가요?", scope: "all" },
  { label: "NFC 전환 조건", question: "V2에서 UWB ranging 실패 시 NFC fallback 조건은 무엇인가요?", scope: "V2" },
  { label: "시동 권한", question: "V2에서 entry-only 권한으로 시동을 걸 수 있나요?", scope: "V2" },
  { label: "BLE 재시도", question: "BLE 연결이 시간 초과되면 몇 번까지 다시 시도할 수 있나요?", scope: "all" },
  { label: "키 폐기", question: "키를 폐기하면 그 키에서 파생된 초대도 함께 거부되나요?", scope: "V2" },
  { label: "일시 정지 키", question: "일시 정지된 친구 키로 NFC 출입을 할 수 있나요?", scope: "V2" },
  { label: "오프라인 동작", question: "차량이 오프라인일 때 대기 중인 초대 승인은 어떻게 처리되나요?", scope: "all" },
  { label: "진단 로그", question: "진단 로그에 기기 식별자를 그대로 남겨도 되나요?", scope: "all" },
  { label: "오류 구분", question: "사용자에게 보여줄 오류 종류는 V1과 V2에서 어떻게 다른가요?", scope: "all" },
];
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
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "요청을 완료하지 못했어요. 다시 시도해주세요.");
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
      <fieldset disabled={pending} className="version-options mode-options" aria-describedby="search-mode-hint"><legend>검색 방식</legend>
        <div className="version-control mode-control">{(["keyword", "ai"] as const).map(value => <label key={value}>
          <input type="radio" name="mode" value={value} checked={mode === value} onChange={() => selectMode(value)} />
          <span>{modeLabels[value]}</span></label>)}</div></fieldset>
      <fieldset disabled={pending} className="version-options"><legend>문서 버전</legend>
        <div className="version-control">{(["all", "V1", "V2"] as const).map(version => <label key={version}>
          <input type="radio" name="version" value={version} checked={scope === version} onChange={() => updateInput(question, version)} />
          <span>{version === "all" ? "전체" : version}</span></label>)}</div></fieldset>
      </div>
      <p className="mode-hint" id="search-mode-hint">{mode === "keyword" ? "AI 호출 없이 원문 근거만 찾아요." : "같은 검색 근거를 바탕으로 AI 답변을 생성해요."}</p>
      <label className="question-label" htmlFor="question">질문</label>
      <div className={`question-composer${error ? " has-error" : ""}`}>
        <textarea id="question" ref={input} value={question} onChange={event => updateInput(event.target.value)}
          onKeyDown={shortcut} disabled={pending} rows={3} aria-invalid={error ? true : undefined}
          aria-describedby={error ? "question-hint question-error" : "question-hint"}
          placeholder="예: V2에서 NFC fallback을 사용할 수 있는 조건은?" />
        <div className="composer-bottom"><span id="question-hint">실제 규격이 아닌 데모용 가상 문서(V1·V2)에서만 검색해요 · 최대 500자</span>
          <div className="composer-actions"><span className={questionLength(question) > 500 ? "character-count too-long" : "character-count"}>{questionLength(question)}/500</span>
            <button className="primary-button" disabled={pending} type="submit">{pending ? "찾는 중…" : "근거 찾기"}<span aria-hidden="true"> ↗</span></button></div></div>
      </div>
      {error && <p className="input-error" id="question-error" role="alert">{error}</p>}
      <div className="examples"><span>예시 질문</span>{examples.map(example => <button type="button" key={example.label} disabled={pending}
        onClick={() => { updateInput(example.question, example.scope); input.current?.focus(); }}>{example.label}<span aria-hidden="true"> ↗</span></button>)}</div>
    </form>
    <p className="search-status" role="status" aria-live="polite">{pending ? mode === "keyword" ? "스펙 문서 속을 열심히 뒤져 보고 있어요 🕵️" : "스펙 문서 속을 열심히 뒤져서 AI 답변을 준비하고 있어요 🕵️" : result ? `${reused ? "이전 실행 결과예요." : "검색이 완료됐어요."} 근거 ${result.sources.length}개를 찾았어요.` : ""}</p>
    {pending && <div className="loading-skeleton" aria-hidden="true"><div /><div /><div /></div>}
    {!pending && result && <div className="result-block">
      <div className="result-context"><span>{reused && <><span className="cached-result">이전 실행 결과</span> · </>}{submitted && modeLabels[submitted.mode]}{submitted?.mode === "ai" && (result.status === "llm_unavailable" || result.status === "search_only") ? " · 답변 생성 불가, 검색 근거 표시" : ""} · {submitted?.scope === "all" ? "전체 버전" : submitted?.scope} 문서</span>
        <span>질문: {submitted?.question}</span></div>
      <div className={`results-grid${result.sources.length ? "" : " no-sources"}`}>
        <AnswerPanel result={result} mode={submitted?.mode} />
        {result.sources.length > 0 && <section className="sources-panel" aria-labelledby="sources-heading"><div className="section-title"><h2 id="sources-heading">검색된 근거 <span className="source-count">{result.sources.length}</span></h2><span>원문 확인</span></div>
          {result.sources.map((source, index) => <EvidenceCard key={source.citationId} evidence={source} index={index} />)}</section>}
      </div>
    </div>}
    {!pending && !result && !error && <div className="first-visit"><span className="empty-rule" /><h2>찾고 싶은 조건이 있나요?</h2><p>질문을 입력하거나 예시를 선택해보세요.<br />결과에서 버전과 원문을 함께 확인할 수 있어요.</p></div>}
  </div>;
}
