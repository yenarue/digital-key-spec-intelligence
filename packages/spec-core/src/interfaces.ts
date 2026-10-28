import type { Evidence, GroundedAnswer, SearchOptions, SourceRequirement, SpecDocument, ValidationResult } from "./types";
export interface CorpusProvider {
  listDocuments(): SpecDocument[];
  getChunks(documentId?: string): SourceRequirement[];
  getSourceSpan(citationId: string): SourceRequirement | undefined;
}
export interface Retriever {
  searchRequirements(query: string, options?: SearchOptions): Evidence[];
  getRequirement(citationId: string): Evidence | undefined;
}
export interface LLMProvider {
  generateGroundedAnswer(input: { question: string; evidence: Evidence[]; locale: "ko" }): Promise<GroundedAnswer>;
}
export interface EvidenceValidator {
  validateCitations(candidate: GroundedAnswer, evidence: Evidence[], corpus: CorpusProvider): ValidationResult;
}
