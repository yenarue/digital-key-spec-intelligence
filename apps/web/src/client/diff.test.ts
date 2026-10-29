import { describe, expect, it } from "vitest";
import { diffWords } from "./diff";

const join = (parts: { text: string }[]) => parts.map(part => part.text).join("");
describe("diffWords", () => {
  it("marks only the differing words and never alters either text", () => {
    const from = "a friend device SHALL NOT create another invitation";
    const to = "a friend device MAY create a single invitation";
    const result = diffWords(from, to);
    expect(join(result.from)).toBe(from);
    expect(join(result.to)).toBe(to);
    expect(result.from.filter(part => part.changed).map(part => part.text.trim())).toEqual(["SHALL NOT", "another"]);
    expect(result.to.filter(part => part.changed).map(part => part.text.trim())).toEqual(["MAY", "a single"]);
    expect(result.changes).toBe(2);
  });
  it("reports no change for identical text", () => {
    const result = diffWords("same words here", "same words here");
    expect(result.changes).toBe(0);
    expect(result.from.every(part => !part.changed)).toBe(true);
  });
});
