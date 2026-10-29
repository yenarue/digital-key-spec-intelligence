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
    broken.steps[1].rules[0].items[0].requirements = ["DEMO-REQ-999"];
    broken.steps[0].rules[0].when = { credential: "revoked" };
    const problems = validateScenarioDefinition(broken, pairs);
    expect(problems.some(problem => problem.includes("DEMO-REQ-999"))).toBe(true);
    expect(problems.some(problem => problem.includes("revoked"))).toBe(true);
    const withoutV1 = pairs.map(pair => pair.key === "DEMO-REQ-009" ? { ...pair, entries: { V2: pair.entries.V2 } } : pair);
    expect(validateScenarioDefinition(definition, withoutV1).some(problem => problem.includes("DEMO-REQ-009") && problem.includes("V1"))).toBe(true);
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
