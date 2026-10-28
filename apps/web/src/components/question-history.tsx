"use client";
import { useRef } from "react";
import type { HistoryEntry } from "../client/history";
import type { SearchMode } from "../contracts/ask";
import { fill, uiText } from "../content/ui-text";

const text = uiText.history;
const modeShort = text.modeShort as Record<SearchMode, string>;
const longFormat = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const clockFormat = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

export function savedTime(iso: string) { return longFormat.format(new Date(iso)); }
/** Today's entries show the clock time, older ones the date, as in the design preview. */
export function shortTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  return date.toDateString() === now.toDateString() ? clockFormat.format(date) : `${date.getMonth() + 1}/${date.getDate()}`;
}
export function scopeLabel(versions: string[]) { return versions.length > 1 ? uiText.search.contextScopeAll : versions[0]; }
function resultTag({ mode, response }: HistoryEntry): [string, string] {
  if (response.status === "answered") return [text.resultAnswered, "tag tag-ai"];
  if (response.sources.length === 0) return [text.resultNone, "tag tag-none"];
  return [fill(mode === "keyword" ? text.resultSourcesKeyword : text.resultSources, { count: response.sources.length }), "tag"];
}
/** Collapsed list of this browser's recent questions; opening one never calls the API. */
export function QuestionHistory({ entries, disabled, currentId, onOpen, onRemove, onClear }: {
  entries: HistoryEntry[]; disabled: boolean; currentId?: string;
  onOpen: (entry: HistoryEntry) => void; onRemove: (id: string) => void; onClear: () => void;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  if (entries.length === 0) return null;
  return <details className="question-history" ref={details}>
    <summary><span>{text.summary}</span><span className="history-count">{fill(text.count, { count: entries.length })}<span className="history-caret" aria-hidden="true"> ▾</span></span></summary>
    <ul>{entries.map(entry => {
      const [result, resultClass] = resultTag(entry);
      return <li key={entry.id} className={entry.id === currentId ? "current" : undefined}>
        <button type="button" className="history-open" disabled={disabled} aria-current={entry.id === currentId ? "true" : undefined}
          onClick={() => { if (details.current) details.current.open = false; onOpen(entry); }}>
          <span className="history-question">{entry.question}</span>
          <span className="history-meta"><span className={entry.mode === "ai" ? "tag tag-ai" : "tag"}>{modeShort[entry.mode]}</span>
            <span className="tag">{entry.versions.length > 1 ? text.scopeAll : entry.versions[0]}</span>
            <span className={resultClass}>{result}</span><time dateTime={entry.submittedAt}>{shortTime(entry.submittedAt)}</time></span>
        </button>
        <button type="button" className="history-remove" disabled={disabled} aria-label={fill(text.remove, { question: entry.question })}
          onClick={() => onRemove(entry.id)}><span aria-hidden="true">×</span></button>
      </li>;
    })}</ul>
    <div className="history-foot"><span>{text.note}</span>
      <button type="button" disabled={disabled} onClick={onClear}>{text.clearAll}</button></div>
  </details>;
}
