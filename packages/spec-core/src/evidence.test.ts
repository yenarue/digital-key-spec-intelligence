import { expect, it } from "vitest";
import v1 from "../../../data/demo/spec-v1.json";
import { SyntheticCorpusProvider } from "./corpus";
import { toEvidence } from "./evidence";

it("maps metadata and the entire untouched fictional clause to evidence", () => {
  const source = new SyntheticCorpusProvider([v1]).getChunks()[0];
  const evidence = toEvidence(source, 3.5);
  expect(evidence).toEqual({
    citationId: source.citationId, documentId: v1.documentId, documentTitle: v1.title,
    version: "V1", sectionId: source.sectionId, requirementId: source.requirementId,
    heading: source.heading, quote: source.text, fullText: source.text, score: 3.5,
  });
  expect(toEvidence(source)).not.toHaveProperty("score");
});
