import type { CorpusProvider } from "./interfaces";
import { VERSIONS, type Requirement, type SourceRequirement, type SpecDocument } from "./types";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(nonempty);
}

function requirement(value: unknown): value is Requirement {
  return record(value)
    && ["requirementId", "sectionId", "heading", "text"].every((key) => nonempty(value[key]))
    && strings(value.keywords) && strings(value.references);
}

/** Validate the public synthetic fixture boundary without changing original text. */
export class SyntheticCorpusProvider implements CorpusProvider {
  private readonly documents: SpecDocument[];
  private readonly sources = new Map<string, SourceRequirement>();

  constructor(documents: unknown) {
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error("A nonempty synthetic document array is required");
    }
    const seenDocuments = new Set<string>();
    for (const document of documents) {
      if (!record(document) || !nonempty(document.documentId) || document.documentId.includes(":")) {
        throw new Error("Invalid documentId");
      }
      if (!nonempty(document.title) || document.synthetic !== true
        || !VERSIONS.includes(document.version as (typeof VERSIONS)[number])) {
        throw new Error("Only labeled synthetic V1/V2 documents are supported");
      }
      if (!Array.isArray(document.requirements) || document.requirements.length === 0
        || !document.requirements.every(requirement)) {
        throw new Error("Invalid or empty requirements");
      }
      const documentKey = `${document.documentId}:${document.version}`;
      if (seenDocuments.has(documentKey)) throw new Error("Duplicate document version");
      seenDocuments.add(documentKey);
      const ids = new Set<string>();
      for (const item of document.requirements as Requirement[]) {
        if (item.requirementId.includes(":") || ids.has(item.requirementId)) {
          throw new Error("Duplicate or invalid requirementId");
        }
        ids.add(item.requirementId);
      }
      for (const item of document.requirements as Requirement[]) {
        if (item.references.some((id) => !ids.has(id))) {
          throw new Error("Unresolved reference in the same document version");
        }
      }
    }
    this.documents = structuredClone(documents) as SpecDocument[];
    for (const document of this.documents) {
      for (const item of document.requirements) {
        const citationId = `SRC:${document.documentId}:${document.version}:${item.requirementId}`;
        this.sources.set(citationId, {
          ...item, citationId, documentId: document.documentId,
          documentTitle: document.title, version: document.version,
        });
      }
    }
  }

  listDocuments(): SpecDocument[] {
    return structuredClone(this.documents);
  }

  getChunks(documentId?: string): SourceRequirement[] {
    return structuredClone([...this.sources.values()].filter((source) => !documentId || source.documentId === documentId));
  }

  getSourceSpan(citationId: string): SourceRequirement | undefined {
    const source = this.sources.get(citationId);
    return source ? structuredClone(source) : undefined;
  }
}
