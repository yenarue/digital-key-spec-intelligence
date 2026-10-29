import "./answer-verification.css";
import type { Evidence } from "@dksi/spec-core";
import { auditAnswer } from "../client/answer-audit";
import { fill, uiText } from "../content/ui-text";

const text = uiText.verification;
/** What was checked by machine (server validation, citation markers) and what only a person can judge. Shown only for answers the server accepted. */
export function AnswerVerification({ answer, sources }: { answer: string; sources: readonly Evidence[] }) {
  const audit = auditAnswer(answer, sources);
  const gaps = audit.uncited.length;
  return <section className="answer-verification" aria-labelledby="verification-heading">
    <h3 id="verification-heading">{text.heading}</h3>
    <ul>
      <li><span className="pill ok">{text.statusOk}</span><span>{fill(text.idsOk, { count: audit.citedIds.length })}</span></li>
      <li><span className="pill ok">{text.statusOk}</span><span>{text.quoteOk}</span></li>
      <li><span className={`pill ${gaps ? "warn" : "ok"}`}>{gaps ? text.statusCheck : text.statusOk}</span>
        <span>{gaps ? fill(text.uncited, { count: gaps }) : text.uncitedNone}
          {gaps > 0 && <details><summary>{text.uncitedDetails}</summary><p>{text.uncitedHint}</p>
            <ul className="uncited-list">{audit.uncited.map((sentence, index) => <li key={index}>{sentence}</li>)}</ul></details>}</span></li>
      <li><span className="pill warn">{text.statusHuman}</span><span>{text.human}</span></li>
    </ul>
  </section>;
}
