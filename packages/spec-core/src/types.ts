export const VERSIONS = ["V1", "V2"] as const;
export type Version = (typeof VERSIONS)[number];
export interface Requirement {
  requirementId: string; sectionId: string; heading: string; text: string;
  keywords: string[]; references: string[];
}
export interface SpecDocument {
  documentId: string; title: string; version: Version; synthetic: boolean;
  disclaimer?: string; topics?: string[]; requirements: Requirement[];
}
export interface SourceRequirement extends Requirement {
  citationId: string; documentId: string; documentTitle: string; version: Version;
}
export interface Evidence {
  citationId: string; documentId: string; documentTitle: string; version: Version;
  sectionId: string; requirementId: string; heading?: string;
  quote: string; fullText: string; score?: number;
}
export interface SearchOptions { versions?: Version[]; topK?: number }
export interface Citation { citationId: string; quote: string }
export interface GroundedAnswer { answer: string; citations: Citation[] }
export interface ValidationResult { valid: boolean; warnings: string[] }
