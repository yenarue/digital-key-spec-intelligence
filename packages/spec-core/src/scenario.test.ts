import { describe, expect, it } from "vitest";
import v1 from "../../../data/demo/spec-v1.json";
import v2 from "../../../data/demo/spec-v2.json";
import scenarios from "../../../data/demo/scenarios.json";
import { buildOverview } from "./overview";
import { precomputeScenarios, runScenario, scenarioKey, validateScenarioDefinition, type ScenarioDefinition } from "./scenario";
import type { SpecDocument } from "./types";

const definition = scenarios as ScenarioDefinition;
const pairs = buildOverview([v1, v2] as SpecDocument[]).pairs;
const base = { version: "V2", uwb: "fail", nfc: "y", credential: "valid", permission: "entry" };
describe("scenario definition", () => {
  it("only references factors, flags and requirements that exist in the corpus", () => {
    expect(validateScenarioDefinition(definition, pairs)).toEqual([]);
  });
  it("reports a rule that cites a requirement missing from the corpus or a version", () => {
    const broken = structuredClone(definition);
    broken.steps[1].rules[0].items[0].requirements = [{ key: "DEMO-REQ-999", quote: "x" }];
    broken.steps[0].rules[0].when = { credential: "revoked" };
    const problems = validateScenarioDefinition(broken, pairs);
    expect(problems.some(problem => problem.includes("DEMO-REQ-999"))).toBe(true);
    expect(problems.some(problem => problem.includes("revoked"))).toBe(true);
    const withoutV1 = pairs.map(pair => pair.key === "DEMO-REQ-009" ? { ...pair, entries: { V2: pair.entries.V2 } } : pair);
    expect(validateScenarioDefinition(definition, withoutV1).some(problem => problem.includes("DEMO-REQ-009") && problem.includes("V1"))).toBe(true);
  });
});
describe("scenario quotes", () => {
  it("rejects a supporting quote that is not verbatim in every applicable version", () => {
    const altered = structuredClone(definition);
    altered.steps[1].rules[0].items[0].requirements = [{ key: "DEMO-REQ-009", quote: "verify an active  credential" }];
    expect(validateScenarioDefinition(altered, pairs).some(problem => problem.includes("글자 그대로 없어요"))).toBe(true);
    const wrongVersion = structuredClone(definition);
    wrongVersion.steps[0].rules[2].items[0].requirements = [{ key: "DEMO-REQ-006", quote: "temporarily suspend a friend credential" }];
    expect(validateScenarioDefinition(wrongVersion, pairs).some(problem => problem.includes("V1") && problem.includes("글자 그대로 없어요"))).toBe(true);
    const missing = structuredClone(definition);
    missing.steps[0].rules[2].items[0].requirements = [{ key: "DEMO-REQ-006", quote: { V1: "A suspended credential SHALL NOT authorize access" } }];
    expect(validateScenarioDefinition(missing, pairs).some(problem => problem.includes("V2") && problem.includes("근거 문구가 없어요"))).toBe(true);
  });
  it("locates each quote inside the original text of the selected version", () => {
    for (const version of ["V1", "V2"]) {
      const result = runScenario(definition, pairs, { ...base, version });
      for (const ref of result.items.flatMap(item => item.refs)) {
        const text = pairs.flatMap(pair => Object.values(pair.entries)).find(entry => entry!.citationId === ref.citationId)!.text;
        expect(ref.start).toBeGreaterThanOrEqual(0);
        expect(text.slice(ref.start, ref.end).length).toBe(ref.end - ref.start);
        expect(ref.end).toBeLessThanOrEqual(text.length);
      }
    }
    const [ref] = runScenario(definition, pairs, { ...base, uwb: "ok", permission: "both" }).items.at(-1)!.refs;
    expect(pairs.find(pair => pair.key === ref.key)!.entries.V2!.text.slice(ref.start, ref.end)).toBe("checked against the credential's allowed operations");
  });
});
describe("runScenario", () => {
  it("lets NFC rescue a failed UWB ranging but still denies the vehicle start with entry-only permission", () => {
    const result = runScenario(definition, pairs, base);
    expect(result.verdicts.map(verdict => [verdict.flag, verdict.allowed])).toEqual([["entry", true], ["start", false]]);
    expect(result.items.at(-1)?.refs[0].requirementId).toBe("DEMO-V2-REQ-012");
    expect(result.verdicts[1].note).toBe("시동 권한 없음");
  });
  it("stops at a suspended credential, naming the blocked verdicts", () => {
    const result = runScenario(definition, pairs, { ...base, credential: "suspended" });
    expect(result.items).toHaveLength(1);
    expect(result.verdicts.map(verdict => verdict.allowed)).toEqual([false, false]);
    expect(result.verdicts[1].note).toBe("출입 단계에서 중단");
  });
  it("cites the requirement of the selected version and words the NFC rule per version", () => {
    const v1 = runScenario(definition, pairs, { ...base, version: "V1" });
    const v2 = runScenario(definition, pairs, base);
    expect(v1.items[2].refs[0].requirementId).toBe("DEMO-V1-REQ-010");
    expect(v1.items[2].text).not.toBe(v2.items[2].text);
  });
  it("allows entry and start with a successful UWB ranging and start permission", () => {
    const result = runScenario(definition, pairs, { ...base, uwb: "ok", permission: "both" });
    expect(result.verdicts.map(verdict => verdict.allowed)).toEqual([true, true]);
  });
  it("precomputes every combination under a stable key", () => {
    const table = precomputeScenarios(definition, pairs);
    expect(Object.keys(table)).toHaveLength(32);
    expect(table[scenarioKey(definition, base)]).toEqual(runScenario(definition, pairs, base));
  });
});
