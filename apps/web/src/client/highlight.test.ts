import { describe, expect, it } from "vitest";
import type { MatchedTerm } from "@dksi/spec-core";
import { highlightParts } from "./highlight";

const term = (ranges: [number, number][]): MatchedTerm => ({ term: "t", fields: ["text"], viaSynonym: false, ranges });
const joined = (parts: { text: string }[]) => parts.map(part => part.text).join("");

describe("match highlighting", () => {
  const full = "a digital key on a device";
  it("marks only the given ranges and keeps the original text", () => {
    const parts = highlightParts(full, full, [term([[2, 9]]), term([[10, 13]])]);
    expect(parts.filter(part => part.marked).map(part => part.text)).toEqual(["digital", "key"]);
    expect(joined(parts)).toBe(full);
  });
  it("merges overlapping and adjacent ranges", () => {
    const parts = highlightParts(full, full, [term([[2, 9], [5, 13]]), term([[13, 16]])]);
    expect(parts).toEqual([{ text: "a ", marked: false }, { text: "digital key on", marked: true }, { text: " a device", marked: false }]);
  });
  it("ignores invalid ranges and malformed matches", () => {
    const bad = [term([[-1, 3], [3, 3], [5, 99], [1.5, 4]]), { term: "x" } as unknown as MatchedTerm];
    expect(highlightParts(full, full, bad)).toEqual([{ text: full, marked: false }]);
    expect(highlightParts("", "", [])).toEqual([{ text: "", marked: false }]);
  });
  it("maps fullText ranges onto a quote substring", () => {
    const parts = highlightParts("key on a device", full, [term([[2, 9], [10, 13], [19, 25]])]);
    expect(parts.filter(part => part.marked).map(part => part.text)).toEqual(["key", "device"]);
    expect(joined(parts)).toBe("key on a device");
    expect(highlightParts("not inside", full, [term([[2, 9]])])).toEqual([{ text: "not inside", marked: false }]);
  });
});
