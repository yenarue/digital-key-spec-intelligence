import { describe, expect, it } from "vitest";
import v1 from "../../../data/demo/spec-v1.json";
import v2 from "../../../data/demo/spec-v2.json";
import { buildOverview } from "./overview";
import { wordSimilarity } from "./text-diff";
import type { SpecDocument } from "./types";

const docs = [v1, v2] as SpecDocument[];
describe("wordSimilarity", () => {
  it("is 1 for identical text, 0 for disjoint text and between for partial overlap", () => {
    expect(wordSimilarity("a b c", "a b c")).toBe(1);
    expect(wordSimilarity("a b", "c d")).toBe(0);
    expect(wordSimilarity("a b c d", "a b x d")).toBeCloseTo(0.75);
  });
});
describe("buildOverview", () => {
  const overview = buildOverview(docs);
  const pair = (key: string) => overview.pairs.find(item => item.key === key)!;
  it("pairs one requirement across versions with stable citation IDs", () => {
    expect(overview.versions).toEqual(["V1", "V2"]);
    expect(pair("DEMO-REQ-004").entries.V1?.citationId).toBe("SRC:DKSI-SYNTHETIC:V1:DEMO-V1-REQ-004");
    expect(pair("DEMO-REQ-004").entries.V2?.requirementId).toBe("DEMO-V2-REQ-004");
  });
  it("classifies changed, unchanged and version-only requirements", () => {
    expect(pair("DEMO-REQ-004").status).toBe("changed");
    expect(pair("DEMO-REQ-004").similarity!).toBeLessThan(pair("DEMO-REQ-001").similarity!);
    expect(overview.pairs.filter(item => item.status === "added").every(item => !item.entries.V1 && item.entries.V2)).toBe(true);
    expect(overview.pairs.filter(item => item.status === "unchanged").every(item => item.similarity === 1)).toBe(true);
  });
  it("keeps every requirement exactly once and in section order, with original text untouched", () => {
    const total = new Set(docs.flatMap(document => document.requirements.map(requirement => requirement.requirementId)));
    expect(overview.pairs.flatMap(item => Object.values(item.entries).map(entry => entry!.requirementId)).sort()).toEqual([...total].sort());
    const sections = overview.pairs.map(item => item.sectionId.split(".").map(Number));
    expect([...sections].sort((a, b) => a[0] - b[0] || (a[1] ?? 0) - (b[1] ?? 0) || (a[2] ?? 0) - (b[2] ?? 0))).toEqual(sections);
    expect(pair("DEMO-REQ-010").entries.V2?.text).toBe(v2.requirements.find(item => item.requirementId === "DEMO-V2-REQ-010")!.text);
  });
  it("treats a single-version corpus as having nothing to compare", () => {
    const single = buildOverview([v1] as SpecDocument[]);
    expect(single.versions).toEqual(["V1"]);
    expect(single.pairs.every(item => item.similarity === null && item.status === "unchanged")).toBe(true);
  });
});
