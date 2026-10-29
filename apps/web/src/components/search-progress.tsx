"use client";
import { useEffect, useState } from "react";
import type { SearchMode } from "../contracts/ask";
import { uiText } from "../content/ui-text";

const text = uiText.progress;
const stepInterval: Record<SearchMode, number> = { keyword: 700, ai: 1500 };
/** Decorative only: the sibling role="status" line already announces the wait. The last step stays active until the response replaces this component. */
export function SearchProgress({ mode }: { mode: SearchMode }) {
  const steps = text.steps[mode];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setActive(index => Math.min(index + 1, steps.length - 1)), stepInterval[mode]);
    return () => clearInterval(timer);
  }, [mode, steps.length]);
  return <div className="search-progress" aria-hidden="true">
    <ol className="progress-steps">{steps.map((label, index) => <li key={label} className={index < active ? "done" : index === active ? "on" : ""}>
      <span className="progress-dot">{index < active ? "✓" : ""}</span>{label}</li>)}</ol>
    <div className="progress-scan"><div className="scan-bar" />
      {text.scanLines.map((line, lineIndex) => <p key={line} lang="en">{line.split(/(\*[^*]+\*)/).map((part, partIndex) => part.startsWith("*")
        ? <span key={partIndex} className="scan-hit" style={{ animationDelay: `${((lineIndex * 3 + partIndex) % 7) * 0.25}s` }}>{part.slice(1, -1)}</span>
        : part)}</p>)}</div>
  </div>;
}
