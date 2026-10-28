import { describe, expect, it, vi } from "vitest";
import type { CorpusProvider, EvidenceValidator, LLMProvider, Retriever } from "@dksi/spec-core";
import { evidenceFixture } from "../test-fixtures/ask";
import { createAskService } from "./ask-service";
import { LLMProviderError } from "./llm/openrouter";

function fakeRetriever(sources = [evidenceFixture]): Retriever {
  return { searchRequirements: vi.fn(() => sources), getRequirement: vi.fn(() => undefined) };
}

describe("retrieval-first ask service", () => {
  it("keeps exact available evidence in search-only output", async () => {
    const retriever = fakeRetriever();
    const result = await createAskService({ retriever })({ question: " NFC 조건 ", versions: ["V2"], topK: 1 });
    expect(result).toMatchObject({ status: "search_only", answer: null, sources: [evidenceFixture] });
    expect(retriever.searchRequirements).toHaveBeenCalledExactlyOnceWith("NFC 조건", { versions: ["V2"], topK: 1 });
  });
  it("does not call a supplied model when there is no evidence", async () => {
    const generateGroundedAnswer = vi.fn();
    const llmProvider: LLMProvider = { generateGroundedAnswer };
    expect(await createAskService({ retriever: fakeRetriever([]), llmProvider })({ question: "우주선 엔진" })).toEqual({ status: "insufficient_evidence", answer: null, sources: [], warnings: [] });
    expect(generateGroundedAnswer).not.toHaveBeenCalled();
  });
  it("rejects invalid input before retrieval", async () => {
    const retriever = fakeRetriever();
    await expect(createAskService({ retriever })({ question: " " })).rejects.toThrow();
    expect(retriever.searchRequirements).not.toHaveBeenCalled();
  });
});

const candidate = {
  answer: `가상 문서의 조건입니다. [${evidenceFixture.citationId}]`,
  citations: [{ citationId: evidenceFixture.citationId, quote: evidenceFixture.quote }],
};
const corpus: CorpusProvider = {
  listDocuments: () => [], getChunks: () => [], getSourceSpan: () => undefined,
};
function completeDependencies() {
  return {
    retriever: fakeRetriever(), corpus,
    validator: { validateCitations: vi.fn(() => ({ valid: true, warnings: [] as string[] })) } satisfies EvidenceValidator,
    llmProvider: { generateGroundedAnswer: vi.fn().mockResolvedValue(candidate) } satisfies LLMProvider,
  };
}

describe("grounded generation orchestration", () => {
  it("retrieves first, calls once and exposes only a valid answer", async () => {
    const deps = completeDependencies();
    const result = await createAskService(deps)({ question: "NFC 조건", versions: ["V2"], topK: 1 });
    expect(result).toEqual({ status: "answered", answer: candidate.answer, sources: [evidenceFixture], warnings: [] });
    expect(deps.llmProvider.generateGroundedAnswer).toHaveBeenCalledExactlyOnceWith({ question: "NFC 조건", evidence: [evidenceFixture], locale: "ko" });
    expect(deps.validator.validateCitations).toHaveBeenCalledExactlyOnceWith(candidate, [evidenceFixture], corpus);
    expect(vi.mocked(deps.retriever.searchRequirements).mock.invocationCallOrder[0]).toBeLessThan(deps.llmProvider.generateGroundedAnswer.mock.invocationCallOrder[0]);
  });
  it("preserves sources and withholds a candidate with invalid citations", async () => {
    const deps = completeDependencies();
    deps.validator.validateCitations.mockReturnValue({ valid: false, warnings: ["untrusted raw model string"] });
    const result = await createAskService(deps)({ question: "NFC 조건" });
    expect(result).toMatchObject({ status: "llm_unavailable", answer: null, sources: [evidenceFixture] });
    expect(result.warnings.join(" ")).toContain("출처를 확인할 수 없어");
    expect(JSON.stringify(result)).not.toContain("untrusted raw model string");
  });
  it.each(["rate_limit", "timeout", "malformed", "unavailable", "response_too_large", "invalid_configuration"] as const)("keeps usable evidence after %s with one call", async (reason) => {
    const deps = completeDependencies();
    deps.llmProvider.generateGroundedAnswer.mockRejectedValue(new LLMProviderError(reason));
    const result = await createAskService(deps)({ question: "NFC 조건" });
    expect(result).toMatchObject({ status: "llm_unavailable", answer: null, sources: [evidenceFixture] });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(deps.llmProvider.generateGroundedAnswer).toHaveBeenCalledOnce();
    expect(deps.validator.validateCitations).not.toHaveBeenCalled();
  });
  it("does not leak unexpected provider errors", async () => {
    const deps = completeDependencies();
    deps.llmProvider.generateGroundedAnswer.mockRejectedValue(new Error("secret-test-key private debug"));
    const result = await createAskService(deps)({ question: "NFC 조건" });
    expect(result.answer).toBeNull();
    expect(JSON.stringify(result)).not.toMatch(/secret-test-key|private debug/);
  });
  it("does not call a model if the actual validator/corpus integration is absent", async () => {
    const deps = completeDependencies();
    expect((await createAskService({ ...deps, validator: undefined })({ question: "NFC" })).status).toBe("search_only");
    expect((await createAskService({ ...deps, corpus: undefined })({ question: "NFC" })).status).toBe("search_only");
    expect(deps.llmProvider.generateGroundedAnswer).not.toHaveBeenCalled();
  });
  it("caps evidence before transmission even if an injected retriever returns extra hits", async () => {
    const deps = completeDependencies();
    const result = await createAskService({ ...deps, retriever: fakeRetriever([evidenceFixture, evidenceFixture]) })({ question: "NFC", topK: 1 });
    expect(result.sources).toHaveLength(1);
    expect(deps.llmProvider.generateGroundedAnswer.mock.calls[0][0].evidence).toHaveLength(1);
  });
});
