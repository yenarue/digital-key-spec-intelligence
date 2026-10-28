import "server-only";
import type { CorpusProvider, EvidenceValidator, LLMProvider, Retriever } from "@dksi/spec-core";
import type { AskService } from "../contracts/ask";
import { validateAskRequest } from "./request-validation";
import { LLMProviderError } from "./llm/openrouter";

export interface AskDependencies {
  retriever: Retriever;
  corpus?: CorpusProvider;
  validator?: EvidenceValidator;
  llmProvider?: LLMProvider;
}

/** Retrieval is always available independently of an LLM or API key. */
export function createAskService(dependencies: AskDependencies): AskService {
  return async (input) => {
    const request = validateAskRequest(input);
    const sources = dependencies.retriever.searchRequirements(request.question, {
      versions: request.versions,
      topK: request.topK,
    }).slice(0, request.topK ?? 5);
    if (sources.length === 0) {
      return { status: "insufficient_evidence", answer: null, sources: [], warnings: [] };
    }
    if (request.mode === "keyword") {
      return { status: "search_only", answer: null, sources, warnings: [] };
    }
    if (!dependencies.llmProvider || !dependencies.corpus || !dependencies.validator) {
      return {
        status: "search_only", answer: null, sources,
        warnings: ["AI 답변 없이 검색된 근거를 보여드립니다."],
      };
    }
    try {
      const candidate = await dependencies.llmProvider.generateGroundedAnswer({
        question: request.question, evidence: sources, locale: "ko",
      });
      const validation = dependencies.validator.validateCitations(candidate, sources, dependencies.corpus);
      if (!validation.valid) {
        return {
          status: "llm_unavailable", answer: null, sources,
          warnings: ["출처를 확인할 수 없어 AI 답변을 표시하지 않았습니다."],
        };
      }
      return { status: "answered", answer: candidate.answer, sources, warnings: validation.warnings };
    } catch (error) {
      const message = error instanceof LLMProviderError && error.reason === "rate_limit"
        ? "현재 AI 요청이 많습니다. 검색된 근거를 먼저 확인해주세요."
        : error instanceof LLMProviderError && error.reason === "timeout"
          ? "AI 답변 대기 시간이 초과되었습니다. 검색된 근거를 확인해주세요."
          : "AI 답변을 가져오지 못했습니다. 검색된 근거는 확인할 수 있습니다.";
      return { status: "llm_unavailable", answer: null, sources, warnings: [message] };
    }
  };
}
