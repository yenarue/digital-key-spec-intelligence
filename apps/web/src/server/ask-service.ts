import "server-only";
import type { CorpusProvider, EvidenceValidator, LLMProvider, Retriever } from "@dksi/spec-core";
import type { AskService } from "../contracts/ask";
import { validateAskRequest } from "./request-validation";
import { LLMProviderError } from "./llm/openrouter";
import { uiText } from "../content/ui-text";

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
          failureReason: "citation_validation",
          warnings: [uiText.answer.failures.citation_validation.message],
        };
      }
      return { status: "answered", answer: candidate.answer, sources, warnings: validation.warnings };
    } catch (error) {
      const failureReason = error instanceof LLMProviderError ? error.reason : "unavailable";
      return { status: "llm_unavailable", answer: null, sources, failureReason,
        warnings: [uiText.answer.failures[failureReason].message] };
    }
  };
}
