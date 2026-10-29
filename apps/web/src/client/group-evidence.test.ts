import { describe, expect, it } from "vitest";
import type { Evidence } from "@dksi/spec-core";
import { groupEvidence } from "./group-evidence";

const evidence = (version: "V1" | "V2", number: string, documentId = "DOC", sectionId = "2.1"): Evidence => ({
  citationId: `SRC:${documentId}:${version}:DEMO-${version}-REQ-${number}`, documentId, documentTitle: "t", version, sectionId,
  requirementId: `DEMO-${version}-REQ-${number}`, quote: "q", fullText: "q",
});
describe("groupEvidence", () => {
  it("merges the same requirement across versions, ranked by first appearance, V1 before V2", () => {
    const groups = groupEvidence([evidence("V2", "004"), evidence("V2", "010"), evidence("V1", "004")]);
    expect(groups.map(group => group.items.map(item => item.requirementId))).toEqual([["DEMO-V1-REQ-004", "DEMO-V2-REQ-004"], ["DEMO-V2-REQ-010"]]);
  });
  it("keeps single-version results and different sections or documents apart", () => {
    expect(groupEvidence([evidence("V1", "004"), evidence("V2", "004", "DOC", "9.9"), evidence("V2", "004", "OTHER")])).toHaveLength(3);
  });
  it("never merges two items of the same version and does not change the input", () => {
    const input = [evidence("V2", "004"), evidence("V2", "004")];
    expect(groupEvidence(input)).toHaveLength(2);
    expect(input[0].version).toBe("V2");
  });
});
