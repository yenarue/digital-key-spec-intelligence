import { describe, expect, it } from "vitest";
import v1 from "../../../data/demo/spec-v1.json";
import v2 from "../../../data/demo/spec-v2.json";
import { SyntheticCorpusProvider } from "./corpus";

describe("SyntheticCorpusProvider", () => {
  it("loads two fictional versions with stable composite IDs and exact text", () => {
    const corpus = new SyntheticCorpusProvider([v1, v2]);
    expect(corpus.listDocuments()).toHaveLength(2);
    expect(corpus.getChunks()).toHaveLength(39);
    expect(new Set(corpus.getChunks().map((source) => source.citationId)).size).toBe(39);
    expect(corpus.getSourceSpan("SRC:DKSI-SYNTHETIC:V1:DEMO-V1-REQ-001")?.text).toBe(v1.requirements[0].text);
    expect(corpus.getChunks("missing")).toEqual([]);
    expect(corpus.getSourceSpan("SRC:DKSI-SYNTHETIC:V1:MADE-UP")).toBeUndefined();
  });

  it("keeps the original registry isolated from external mutation", () => {
    const documents = structuredClone([v1]);
    const corpus = new SyntheticCorpusProvider(documents);
    documents[0].requirements[0].text = "modified input";
    corpus.listDocuments()[0].requirements[0].text = "modified output";
    corpus.getChunks()[0].text = "modified source";
    const id = "SRC:DKSI-SYNTHETIC:V1:DEMO-V1-REQ-001";
    corpus.getSourceSpan(id)!.text = "modified span";
    expect(corpus.getSourceSpan(id)?.text).toBe(v1.requirements[0].text);
  });

  it.each([
    ["not synthetic", { ...v1, synthetic: false }],
    ["unknown version", { ...v1, version: "V3" }],
    ["empty title", { ...v1, title: " " }],
    ["invalid document ID", { ...v1, documentId: "invalid:id" }],
    ["empty requirements", { ...v1, requirements: [] }],
    ["missing text", { ...v1, requirements: [{ ...v1.requirements[0], text: "" }] }],
    ["duplicate IDs", { ...v1, requirements: [v1.requirements[0], v1.requirements[0]] }],
    ["invalid references", { ...v1, requirements: [{ ...v1.requirements[0], references: ["missing"] }] }],
    ["cross-version reference", { ...v1, requirements: [{ ...v1.requirements[0], references: ["DEMO-V2-REQ-001"] }] }],
    ["invalid keywords", { ...v1, requirements: [{ ...v1.requirements[0], keywords: [9] }] }],
  ])("rejects %s", (_label, document) => {
    expect(() => new SyntheticCorpusProvider([document])).toThrow();
  });

  it("rejects malformed arrays and duplicate document versions", () => {
    expect(() => new SyntheticCorpusProvider(null)).toThrow();
    expect(() => new SyntheticCorpusProvider([])).toThrow();
    expect(() => new SyntheticCorpusProvider([v1, v1])).toThrow();
  });
});
