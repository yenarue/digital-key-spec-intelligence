import type { CorpusProvider, EvidenceValidator } from "./interfaces";
import type { Evidence, GroundedAnswer, ValidationResult } from "./types";

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Checks attribution identity only. A passing result does not establish logical entailment. */
export function validateCitations(
  candidate: GroundedAnswer,
  evidence: Evidence[],
  corpus: CorpusProvider,
): ValidationResult {
  const fail = (message: string): ValidationResult => ({ valid: false, warnings: [message] });
  if (!candidate || !nonempty(candidate.answer) || !Array.isArray(candidate.citations)
    || candidate.citations.length === 0 || !Array.isArray(evidence) || evidence.length === 0) {
    return fail("답변과 검색된 근거에 유효한 인용이 필요합니다.");
  }

  const allowed = new Map<string, Evidence>();
  for (const item of evidence) {
    if (!item || !nonempty(item.citationId) || allowed.has(item.citationId)) {
      return fail("검색 근거 식별자가 올바르지 않습니다.");
    }
    const original = corpus.getSourceSpan(item.citationId);
    if (!original
      || original.citationId !== `SRC:${original.documentId}:${original.version}:${original.requirementId}`
      || item.documentId !== original.documentId || item.documentTitle !== original.documentTitle
      || item.version !== original.version || item.sectionId !== original.sectionId
      || item.requirementId !== original.requirementId
      || (item.heading !== undefined && item.heading !== original.heading)
      || item.fullText !== original.text || !nonempty(item.quote) || !original.text.includes(item.quote)) {
      return fail("검색 근거의 문서·버전·식별자 또는 원문이 일치하지 않습니다.");
    }
    allowed.set(item.citationId, item);
  }

  const listed = new Set<string>();
  for (const citation of candidate.citations) {
    if (!citation || !nonempty(citation.citationId) || !nonempty(citation.quote)
      || listed.has(citation.citationId)) {
      return fail("모델 인용 목록이 비어 있거나 중복·변조되었습니다.");
    }
    const source = allowed.get(citation.citationId);
    const original = corpus.getSourceSpan(citation.citationId);
    if (!source || !original || !original.text.includes(citation.quote)) {
      return fail("모델이 검색되지 않은 출처나 원문과 다른 문구를 인용했습니다.");
    }
    listed.add(citation.citationId);
  }

  const inline = [...candidate.answer.matchAll(/\[(SRC:[^\[\]\r\n]+)\]/gu)].map((match) => match[1]);
  if (inline.length === 0 || (candidate.answer.match(/SRC:/gu)?.length ?? 0) !== inline.length) {
    return fail("답변 본문에 올바른 형식의 근거 인용이 필요합니다.");
  }
  const used = new Set(inline);
  if ([...used].some((id) => !allowed.has(id) || !listed.has(id))
    || [...listed].some((id) => !used.has(id))) {
    return fail("답변 본문의 인용과 검색된 근거·인용 목록이 일치하지 않습니다.");
  }
  return { valid: true, warnings: [] };
}

export class SourceEvidenceValidator implements EvidenceValidator {
  validateCitations(candidate: GroundedAnswer, evidence: Evidence[], corpus: CorpusProvider): ValidationResult {
    return validateCitations(candidate, evidence, corpus);
  }
}
