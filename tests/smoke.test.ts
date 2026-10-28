import { describe, expect, it } from "vitest";
import v1 from "../data/demo/spec-v1.json";
import v2 from "../data/demo/spec-v2.json";
import { VERSIONS } from "../packages/spec-core/src/types";
describe("committed synthetic corpus", () => {
  it("bundles two fictional versions with 16 original requirements each", () => {
    expect([v1.version, v2.version]).toEqual(VERSIONS);
    for (const doc of [v1, v2]) { expect(doc.synthetic).toBe(true); expect(doc.requirements).toHaveLength(16); }
  });
});
