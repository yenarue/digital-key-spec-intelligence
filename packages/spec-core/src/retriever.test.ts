import { describe, expect, it } from "vitest";
import v1 from "../../../data/demo/spec-v1.json";
import v2 from "../../../data/demo/spec-v2.json";
import { SyntheticCorpusProvider } from "./corpus";
import { MiniSearchRetriever } from "./retriever";
import type { Version } from "./types";
import benchmark from "../../../evals/questions.json";

const corpus = new SyntheticCorpusProvider([v1, v2]);
const retriever = new MiniSearchRetriever(corpus);

describe("MiniSearchRetriever", () => {
  it.each(benchmark.cases)("satisfies every expected top-five ID for $id", (item) => {
    const hits = retriever.searchRequirements(item.question, { versions: item.versions as Version[] });
    expect(hits.every((hit) => item.versions.includes(hit.version))).toBe(true);
    if (item.expectedRequirementIds.length === 0) expect(hits).toEqual([]);
    for (const id of item.expectedRequirementIds) expect(hits.map((hit) => hit.requirementId)).toContain(id);
  });
  it("retrieves a known requirement in the top five with exact original metadata", () => {
    const hits = retriever.searchRequirements("owner device 등록할 때 어떤 검증이 필요해?", { versions: ["V1"] });
    expect(hits.map((hit) => hit.requirementId)).toContain("DEMO-V1-REQ-001");
    expect(hits.length).toBeLessThanOrEqual(5);
    for (const hit of hits) {
      const source = corpus.getSourceSpan(hit.citationId)!;
      expect(hit.fullText).toBe(source.text);
      expect(hit.quote).toBe(source.text);
      expect(hit.documentTitle).toBe(source.documentTitle);
      expect(hit.sectionId).toBe(source.sectionId);
      expect(hit.score).toBeGreaterThan(0);
    }
  });

  it.each(["V1", "V2"] as Version[])("never leaks another version when %s is selected", (version) => {
    const hits = retriever.searchRequirements("NFC fallback", { versions: [version], topK: 8 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.version === version)).toBe(true);
    const hidden = version === "V1" ? "V2" : "V1";
    expect(retriever.searchRequirements(`DEMO-${hidden}-REQ-010`, { versions: [version] })).toEqual([]);
  });

  it("supports both versions and limits requested results", () => {
    const hits = retriever.searchRequirements("NFC fallback", { topK: 8 });
    expect(new Set(hits.map((hit) => hit.version))).toEqual(new Set(["V1", "V2"]));
    expect(hits.length).toBeLessThanOrEqual(8);
    expect(retriever.searchRequirements("NFC fallback", { topK: 1 })).toHaveLength(1);
  });

  it("returns no invented evidence for blank and unrelated questions", () => {
    expect(retriever.searchRequirements("  ")).toEqual([]);
    expect(retriever.searchRequirements("우주선 추진엔진 사양이 뭐야?")).toEqual([]);
  });

  it("handles exact requirement and citation ID lookups deterministically", () => {
    const citationId = "SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-010";
    expect(retriever.searchRequirements(citationId)[0].citationId).toBe(citationId);
    expect(retriever.searchRequirements("DEMO-V2-REQ-010")[0].citationId).toBe(citationId);
    expect(retriever.getRequirement(citationId)?.fullText).toBe(v2.requirements[9].text);
    expect(retriever.getRequirement("fake")).toBeUndefined();
    expect(retriever.searchRequirements("NFC")).toEqual(retriever.searchRequirements("NFC"));
  });

  it("rejects invalid limits, versions and overlong queries at the core boundary", () => {
    for (const topK of [0, 9, 1.5, NaN]) expect(() => retriever.searchRequirements("NFC", { topK })).toThrow();
    expect(() => retriever.searchRequirements("NFC", { versions: [] })).toThrow();
    expect(() => retriever.searchRequirements("NFC", { versions: ["V3" as Version] })).toThrow();
    expect(() => retriever.searchRequirements("가".repeat(501))).toThrow();
  });
});
