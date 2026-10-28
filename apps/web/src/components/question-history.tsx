"use client";
import type { HistoryEntry } from "../client/history";
import type { SearchMode } from "../contracts/ask";
import { fill, uiText } from "../content/ui-text";

const text = uiText.history;
const modeLabels = uiText.search.modeLabels as Record<SearchMode, string>;
const timeFormat = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function savedTime(iso: string) { return timeFormat.format(new Date(iso)); }
export function scopeLabel(versions: string[]) { return versions.length > 1 ? uiText.search.contextScopeAll : versions[0]; }
function resultSummary({ mode, response }: HistoryEntry) {
  if (response.status === "answered") return text.resultAnswered;
  if (response.sources.length === 0) return text.resultNone;
  return fill(mode === "keyword" ? text.resultSourcesKeyword : text.resultSources, { count: response.sources.length });
}
/** Collapsed list of this browser's recent questions; opening one never calls the API. */
export function QuestionHistory({ entries, disabled, onOpen, onRemove, onClear }: {
  entries: HistoryEntry[]; disabled: boolean;
  onOpen: (entry: HistoryEntry) => void; onRemove: (id: string) => void; onClear: () => void;
}) {
  if (entries.length === 0) return null;
  return <details className="question-history">
    <summary>{text.summary} <span>{fill(text.count, { count: entries.length })}</span></summary>
    <ul>{entries.map(entry => <li key={entry.id}>
      <button type="button" className="history-open" disabled={disabled} onClick={() => onOpen(entry)}>
        <span className="history-question">{entry.question}</span>
        <span className="history-meta"><span>{modeLabels[entry.mode]}</span><span>{scopeLabel(entry.versions)}</span>
          <span>{resultSummary(entry)}</span><time dateTime={entry.submittedAt}>{savedTime(entry.submittedAt)}</time></span>
      </button>
      <button type="button" className="history-remove" disabled={disabled} aria-label={fill(text.remove, { question: entry.question })}
        onClick={() => onRemove(entry.id)}><span aria-hidden="true">×</span></button>
    </li>)}</ul>
    <div className="history-foot"><span>{text.note}</span>
      <button type="button" disabled={disabled} onClick={onClear}>{text.clearAll}</button></div>
  </details>;
}
