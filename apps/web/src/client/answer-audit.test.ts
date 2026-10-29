import { describe, expect, it } from "vitest";
import type { Evidence } from "@dksi/spec-core";
import { auditAnswer } from "./answer-audit";

const source = (id: string): Evidence => ({ citationId: id, documentId: "D", documentTitle: "t", version: "V2", sectionId: "1", requirementId: "R", quote: "q", fullText: "q" });
const A = "SRC:D:V2:A", B = "SRC:D:V2:B";
describe("auditAnswer", () => {
  it("counts each known cited ID once and finds nothing uncited when every sentence is cited", () => {
    const result = auditAnswer(`시동은 불가해요 [${A}]. 정지된 자격은 거부돼요 [${B}] 또한 [${A}]`, [source(A), source(B)]);
    expect(result.citedIds).toEqual([A, B]);
    expect(result.uncited).toEqual([]);
  });
  it("attaches a citation written after the full stop to the sentence before it", () => {
    expect(auditAnswer(`시동은 불가해요. [${A}]`, [source(A)]).uncited).toEqual([]);
  });
  it("reports uncited sentences and bullet lines without the bullet marker", () => {
    const answer = `직접 결론이에요 [${A}].\n\n- 근거 있는 항목 [${B}]\n- 해석이 섞인 항목\n이건 원문에 없는 해석이에요.`;
    expect(auditAnswer(answer, [source(A), source(B)]).uncited.map(sentence => sentence.text)).toEqual(["해석이 섞인 항목", "이건 원문에 없는 해석이에요."]);
  });
  it("does not flag a reply word on its own, but still flags a reply that carries a claim", () => {
    const texts = (answer: string) => auditAnswer(answer, [source(A)]).uncited.map(sentence => sentence.text);
    expect(texts(`네.\n\n시동은 불가해요 [${A}].`)).toEqual([]);
    expect(texts(`아니요, 안 돼요 [${A}]. No.`)).toEqual([]);
    expect(texts(`네, 가능해요.`)).toEqual(["네, 가능해요."]);
    expect(texts(`네.\n[${A}]\n해석이에요.`)).toEqual(["해석이에요."]);
  });
  it("returns the exact range of each uncited sentence inside the original answer", () => {
    const answer = `직접 결론이에요 [${A}].\n\n- 해석이 섞인 항목\n이건 원문에 없는 해석이에요.`;
    const ranges = auditAnswer(answer, [source(A)]).uncited.map(({ start, end }) => answer.slice(start, end));
    expect(ranges).toEqual(["해석이 섞인 항목", "이건 원문에 없는 해석이에요."]);
  });
  it("ignores citation IDs that are not in the sources", () => {
    expect(auditAnswer(`가짜예요 [SRC:X:V1:Z]`, [source(A)]).citedIds).toEqual([]);
  });
});
