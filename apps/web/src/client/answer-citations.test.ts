import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { splitAnswerCitations } from "./answer-citations";
import { AnswerPanel } from "../components/answer-panel";
import { evidenceFixture } from "../test-fixtures/ask";

const id = evidenceFixture.citationId;
describe("answer citation rendering", () => {
  it("links only exact IDs in the retrieved evidence and preserves surrounding text", () => {
    const parts = splitAnswerCitations(`조건 [${id}] 다음 [SRC:invented].`, [evidenceFixture]);
    expect(parts.filter(part => part.kind === "citation")).toEqual([{ kind: "citation", sourceIndex: 0, source: evidenceFixture }]);
    expect(parts.filter(part => part.kind === "text").map(part => part.text).join("")).toBe("조건  다음 [SRC:invented].");
    expect(splitAnswerCitations(`[${id}]`, [])).toEqual([{ kind: "text", text: `[${id}]` }]);
  });
  it("renders model text safely and gives real citation links accessible source names", () => {
    const markup = renderToStaticMarkup(createElement(AnswerPanel, { result: {
      status: "answered", answer: `<img src=x onerror=alert(1)> [${id}]\n\n다음 조건`, sources: [evidenceFixture], warnings: [],
    } }));
    expect(markup).not.toContain("<img");
    expect(markup).toContain("&lt;img");
    expect(markup).toContain("aria-label=\"근거 1: V2 DEMO-V2-REQ-010\"");
    expect(markup).toContain("href=\"#source-SRC-DKSI-SYNTHETIC-V2-DEMO-V2-REQ-010\"");
    expect(markup.match(/class="answer-text"/g)).toHaveLength(2);
  });
  it("does not display a candidate answer in fallback status and escapes warnings", () => {
    const markup = renderToStaticMarkup(createElement(AnswerPanel, { result: {
      status: "llm_unavailable", answer: "이 답변은 노출하면 안 됩니다", sources: [evidenceFixture], warnings: ["<script>unsafe</script>"],
    } }));
    expect(markup).not.toContain("이 답변은 노출하면 안 됩니다");
    expect(markup).not.toContain("<script>");
    expect(markup).toContain("AI 답변을 가져오지 못했어요");
  });
});


describe("failure-specific answer display", () => {
  it.each(["timeout", "rate_limit", "citation_validation", "malformed", "response_too_large", "invalid_configuration", "unavailable"] as const)("renders the service's %s reason without mislabeling it as citation rejection", async reason => {
    const { createAskService } = await import("../server/ask-service");
    const { LLMProviderError } = await import("../server/llm/openrouter");
    const { uiText } = await import("../content/ui-text");
    const result = await createAskService({
      retriever: {searchRequirements:()=>[evidenceFixture], getRequirement:()=>undefined},
      corpus: {listDocuments:()=>[], getChunks:()=>[], getSourceSpan:()=>undefined},
      validator: {validateCitations:()=>({valid:false,warnings:[]})},
      llmProvider: {generateGroundedAnswer:async()=> {
        if(reason !== "citation_validation") throw new LLMProviderError(reason);
        return {answer:"invalid",citations:[]};
      }},
    })({question:"NFC"});
    const markup = renderToStaticMarkup(createElement(AnswerPanel, {result}));
    expect(markup).toContain(uiText.answer.failures[reason].heading);
    expect(markup).toContain(uiText.answer.failures[reason].message);
    if(reason !== "citation_validation") expect(markup).not.toContain(uiText.answer.failures.citation_validation.heading);
    expect(result.sources).toEqual([evidenceFixture]);
  });
});
