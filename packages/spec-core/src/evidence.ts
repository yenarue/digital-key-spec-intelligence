import type { Evidence, SourceRequirement } from "./types";

/** Entire short fictional clauses retain conditions and exception wording. */
export function toEvidence(source: SourceRequirement, score?: number): Evidence {
  return {
    citationId: source.citationId, documentId: source.documentId,
    documentTitle: source.documentTitle, version: source.version,
    sectionId: source.sectionId, requirementId: source.requirementId,
    heading: source.heading, quote: source.text, fullText: source.text,
    ...(score === undefined ? {} : { score }),
  };
}
