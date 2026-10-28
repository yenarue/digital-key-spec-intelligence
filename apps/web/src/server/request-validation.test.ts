import { describe, expect, it } from "vitest";
import { RequestValidationError, validateAskRequest } from "./request-validation";

describe("validateAskRequest", () => {
  it("trims Korean/English questions and sets known-version/topK defaults", () => {
    expect(validateAskRequest({ question: "  NFC 조건은?  " })).toEqual({ question: "NFC 조건은?", versions: ["V1", "V2"], topK: 5, mode: "ai" });
    expect(validateAskRequest({ question: "owner device", versions: ["V2", "V2"], topK: 8 })).toEqual({ question: "owner device", versions: ["V2"], topK: 8, mode: "ai" });
  });
  it("counts Unicode code points consistently at 500 and 501", () => {
    expect(validateAskRequest({ question: "🚗".repeat(500) }).question).toHaveLength(1000);
    expect(() => validateAskRequest({ question: "가".repeat(501) })).toThrow(RequestValidationError);
  });
  it.each([null, [], "NFC", {}, { question: 4 }, { question: "   " }, { question: "NFC", versions: [] }, { question: "NFC", versions: ["V3"] }, { question: "NFC", versions: "V1" }, { question: "NFC", topK: 0 }, { question: "NFC", topK: 9 }, { question: "NFC", topK: 1.5 }, { question: "NFC", topK: "5" }, { question: "NFC", topK: null }])("rejects invalid input %#", (value) => {
    expect(() => validateAskRequest(value)).toThrow(RequestValidationError);
  });
  it("accepts topK lower bound and single-version requests", () => {
    expect(validateAskRequest({ question: "NFC", versions: ["V1"], topK: 1 })).toEqual({ question: "NFC", versions: ["V1"], topK: 1, mode: "ai" });
  });
  it.each(["keyword", "ai"] as const)("accepts explicit %s mode", (mode) => {
    expect(validateAskRequest({ question: "NFC", mode }).mode).toBe(mode);
  });
  it.each(["", "AI", "semantic", null, 1, false, [], {}])("rejects invalid mode %#", (mode) => {
    expect(() => validateAskRequest({ question: "NFC", mode })).toThrow(RequestValidationError);
  });
});
