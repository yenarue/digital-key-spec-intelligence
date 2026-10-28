import { describe, expect, it } from "vitest";
import { expandQuery, SYNONYM_GROUPS } from "./synonyms";

describe("static Korean-English term expansion", () => {
  it.each([
    ["등록할 때", "provisioning"], ["공유", "sharing"], ["재공유할 수", "delegation"],
    ["폐기된 키", "revocation"], ["권한이", "entitlement"], ["재시도를", "retry"],
    ["태그로", "tap"], ["개인정보를", "privacy"],
  ])("maps %s to %s", (question, term) => {
    expect(expandQuery(question)).toContain(term);
  });
  it("has at least five bilingual groups and does not expand unrelated substrings", () => {
    expect(SYNONYM_GROUPS.length).toBeGreaterThanOrEqual(5);
    expect(expandQuery("공유기 설치")).toBe("공유기 설치");
    expect(expandQuery("우주선 추진엔진 사양")).toBe("우주선 추진엔진 사양");
  });
});
