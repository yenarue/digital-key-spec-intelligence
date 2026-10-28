import { describe, expect, it } from "vitest";
import v1 from "../../../data/demo/spec-v1.json";
import v2 from "../../../data/demo/spec-v2.json";
import { SyntheticCorpusProvider } from "./corpus";
import { toEvidence } from "./evidence";
import { SourceEvidenceValidator } from "./evidence-validator";
import type { Evidence, GroundedAnswer } from "./types";

const corpus = new SyntheticCorpusProvider([v1, v2]);
const source = toEvidence(corpus.getSourceSpan("SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-010")!);
const other = toEvidence(corpus.getSourceSpan("SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-011")!);
const v1source = toEvidence(corpus.getSourceSpan("SRC:DKSI-SYNTHETIC:V1:DEMO-V1-REQ-010")!);
const validator = new SourceEvidenceValidator();
const candidate: GroundedAnswer = {
  answer: `가상 V2에서는 NFC 접근 권한이 있는 경우 별도 절차를 시도할 수 있습니다. [${source.citationId}]`,
  citations: [{ citationId: source.citationId, quote: source.quote }],
};
const validate = (answer: GroundedAnswer = candidate, evidence: Evidence[] = [source]) => validator.validateCitations(answer, evidence, corpus);

describe("SourceEvidenceValidator", () => {
  it("accepts matching retrieved identity and exact source quote", () => {
    expect(validate()).toEqual({ valid: true, warnings: [] });
    expect(validate({ ...candidate, citations: [{ citationId: source.citationId, quote: "passive entry SHALL stop." }] }).valid).toBe(true);
  });

  it("does not mutate evidence or model output", () => {
    const answerBefore = structuredClone(candidate);
    const evidenceBefore = structuredClone(source);
    validate();
    expect(candidate).toEqual(answerBefore);
    expect(source).toEqual(evidenceBefore);
  });

  it.each([
    ["fabricated ID", { answer: "가상 주장 [SRC:DKSI-SYNTHETIC:V2:MADE-UP]", citations: [{ citationId: "SRC:DKSI-SYNTHETIC:V2:MADE-UP", quote: source.quote }] }],
    ["existing but unretrieved ID", { answer: `가상 주장 [${other.citationId}]`, citations: [{ citationId: other.citationId, quote: other.quote }] }],
    ["another version", { answer: `가상 주장 [${v1source.citationId}]`, citations: [{ citationId: v1source.citationId, quote: v1source.quote }] }],
    ["altered quote", { ...candidate, citations: [{ citationId: source.citationId, quote: "NFC access is automatic." }] }],
    ["empty quote", { ...candidate, citations: [{ citationId: source.citationId, quote: " " }] }],
    ["uncited answer", { ...candidate, answer: "근거 없는 답변입니다." }],
    ["empty list", { ...candidate, citations: [] }],
    ["inline outside listed set", { ...candidate, answer: `${candidate.answer} [${other.citationId}]` }],
    ["orphan list entry", { ...candidate, citations: [...candidate.citations, { citationId: other.citationId, quote: other.quote }] }],
    ["duplicate list entry", { ...candidate, citations: [...candidate.citations, ...candidate.citations] }],
    ["bare ID", { ...candidate, answer: `가상 주장 ${source.citationId}` }],
    ["malformed extra ID", { ...candidate, answer: `${candidate.answer} SRC:invented` }],
  ])("rejects %s", (_name, answer) => {
    const result = validate(answer);
    expect(result.valid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it.each([
    ["document", { ...source, documentId: "OTHER" }],
    ["title", { ...source, documentTitle: "Official CCC" }],
    ["version", { ...source, version: "V1" as const }],
    ["section", { ...source, sectionId: "9.9" }],
    ["requirement", { ...source, requirementId: "DEMO-V2-REQ-011" }],
    ["heading", { ...source, heading: "Changed heading" }],
    ["full text", { ...source, fullText: source.fullText + " altered" }],
    ["retrieved quote", { ...source, quote: "altered" }],
    ["retrieved empty quote", { ...source, quote: "" }],
  ])("rejects evidence identity mismatch: %s", (_name, evidence) => {
    expect(validate(candidate, [evidence]).valid).toBe(false);
  });

  it("rejects missing evidence and duplicate retrieved IDs", () => {
    expect(validate(candidate, []).valid).toBe(false);
    expect(validate(candidate, [source, source]).valid).toBe(false);
  });

  it("accepts multiple inline citations with matching distinct listed sources", () => {
    const answer = { answer: `${candidate.answer} NFC 태그 조건도 확인합니다. [${other.citationId}]`, citations: [...candidate.citations, { citationId: other.citationId, quote: other.quote }] };
    expect(validate(answer, [source, other]).valid).toBe(true);
  });
});
