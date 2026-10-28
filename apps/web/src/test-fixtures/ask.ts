import v2 from "../../../../data/demo/spec-v2.json";
import type { AskResponse } from "../contracts/ask";
import type { Evidence } from "@dksi/spec-core";
const requirement = v2.requirements[9];
export const evidenceFixture: Evidence = {
  citationId: `SRC:${v2.documentId}:V2:${requirement.requirementId}`, documentId: v2.documentId,
  documentTitle: v2.title, version: "V2", sectionId: requirement.sectionId,
  requirementId: requirement.requirementId, heading: requirement.heading, quote: requirement.text, fullText: requirement.text,
};
export const searchOnlyFixture: AskResponse = { status: "search_only", answer: null, sources: [evidenceFixture], warnings: [] };
export const emptyFixture: AskResponse = { status: "insufficient_evidence", answer: null, sources: [], warnings: [] };
