import type { OverviewPair } from "./overview";
import { VERSIONS, type Version } from "./types";

export type ScenarioKind = "ok" | "no" | "go";
export interface ScenarioFactor { id: string; label: string; default: string; options: { value: string; label: string }[] }
export interface ScenarioItem { kind: ScenarioKind; text: string; /** Versionless requirement keys, see `OverviewPair.key`. */ requirements: string[] }
export interface ScenarioRule { when: Record<string, string | string[]>; items: ScenarioItem[]; set?: Record<string, boolean>; stop?: boolean }
export interface ScenarioStep { id: string; onlyIf?: Record<string, boolean>; rules: ScenarioRule[] }
export interface ScenarioVerdict {
  flag: string; label: string; yes: string; no: string; yesNote: string; noNote: string;
  /** When this flag is false the verdict cannot be reached at all, and `noNoteIfBlocked` explains why. */
  dependsOn?: string; noNoteIfBlocked?: string;
}
/** A human-reviewed rule set. The rules are data, not code, so a reviewed set for a real spec replaces this file without touching the UI. */
export interface ScenarioDefinition {
  schemaVersion: 1; documentId: string;
  review: { status: "draft" | "author-reviewed" | "expert-reviewed"; note: string };
  versionFactor: string; factors: ScenarioFactor[]; steps: ScenarioStep[]; verdicts: ScenarioVerdict[];
}
export interface ScenarioRef { key: string; requirementId: string; citationId: string; heading: string }
export interface ScenarioResult {
  items: { kind: ScenarioKind; text: string; refs: ScenarioRef[] }[];
  verdicts: { flag: string; label: string; allowed: boolean; value: string; note: string }[];
}

const matches = (when: ScenarioRule["when"], inputs: Record<string, string>) =>
  Object.entries(when).every(([factor, expected]) => (Array.isArray(expected) ? expected : [expected]).includes(inputs[factor]));
export function scenarioKey(definition: ScenarioDefinition, inputs: Record<string, string>): string {
  return definition.factors.map(factor => inputs[factor.id] ?? factor.default).join("|");
}
export function runScenario(definition: ScenarioDefinition, pairs: readonly OverviewPair[], inputs: Record<string, string>): ScenarioResult {
  const version = inputs[definition.versionFactor] as Version;
  const flags: Record<string, boolean> = {};
  const items: ScenarioResult["items"] = [];
  let halted = false;
  for (const step of definition.steps) {
    if (halted) break;
    if (step.onlyIf && !Object.entries(step.onlyIf).every(([flag, value]) => Boolean(flags[flag]) === value)) continue;
    const rule = step.rules.find(candidate => matches(candidate.when, inputs));
    if (!rule) continue;
    for (const item of rule.items) {
      const refs = item.requirements.flatMap(key => {
        const entry = pairs.find(pair => pair.key === key)?.entries[version];
        const pair = pairs.find(candidate => candidate.key === key);
        return entry && pair ? [{ key, requirementId: entry.requirementId, citationId: entry.citationId, heading: pair.heading }] : [];
      });
      items.push({ kind: item.kind, text: item.text, refs });
    }
    Object.assign(flags, rule.set);
    if (rule.stop) halted = true;
  }
  const verdicts = definition.verdicts.map(verdict => {
    const allowed = Boolean(flags[verdict.flag]);
    const blocked = verdict.dependsOn !== undefined && !flags[verdict.dependsOn];
    return { flag: verdict.flag, label: verdict.label, allowed, value: allowed ? verdict.yes : verdict.no,
      note: allowed ? verdict.yesNote : blocked && verdict.noNoteIfBlocked ? verdict.noNoteIfBlocked : verdict.noNote };
  });
  return { items, verdicts };
}
function combinations(factors: readonly ScenarioFactor[]): Record<string, string>[] {
  return factors.reduce<Record<string, string>[]>((all, factor) => all.flatMap(base => factor.options.map(option => ({ ...base, [factor.id]: option.value }))), [{}]);
}
/** Every input combination, precomputed so a client can look results up without shipping the engine. */
export function precomputeScenarios(definition: ScenarioDefinition, pairs: readonly OverviewPair[]): Record<string, ScenarioResult> {
  return Object.fromEntries(combinations(definition.factors).map(inputs => [scenarioKey(definition, inputs), runScenario(definition, pairs, inputs)]));
}
/** Returns human-readable problems; an empty list means the rules only use factors, flags and requirements that exist. */
export function validateScenarioDefinition(definition: ScenarioDefinition, pairs: readonly OverviewPair[]): string[] {
  const problems: string[] = [];
  const factors = new Map(definition.factors.map(factor => [factor.id, factor]));
  if (factors.size !== definition.factors.length) problems.push("중복된 factor id가 있어요.");
  const versionFactor = factors.get(definition.versionFactor);
  if (!versionFactor) problems.push(`versionFactor "${definition.versionFactor}"가 factors에 없어요.`);
  else for (const option of versionFactor.options) if (!(VERSIONS as readonly string[]).includes(option.value)) problems.push(`버전 값 "${option.value}"을 알 수 없어요.`);
  for (const factor of definition.factors) if (!factor.options.some(option => option.value === factor.default)) problems.push(`factor "${factor.id}"의 기본값이 선택지에 없어요.`);
  const setFlags = new Set<string>();
  for (const step of definition.steps) for (const rule of step.rules) {
    for (const [factorId, expected] of Object.entries(rule.when)) {
      const factor = factors.get(factorId);
      if (!factor) { problems.push(`step "${step.id}": 알 수 없는 factor "${factorId}"`); continue; }
      for (const value of Array.isArray(expected) ? expected : [expected]) if (!factor.options.some(option => option.value === value)) problems.push(`step "${step.id}": factor "${factorId}"에 값 "${value}"이 없어요.`);
    }
    for (const flag of Object.keys(rule.set ?? {})) setFlags.add(flag);
    const versions = versionFactor ? versionFactor.options.map(option => option.value as Version) : [];
    for (const item of rule.items) for (const key of item.requirements) {
      const pair = pairs.find(candidate => candidate.key === key);
      if (!pair) { problems.push(`step "${step.id}": 요구사항 "${key}"를 찾을 수 없어요.`); continue; }
      const required = typeof rule.when[definition.versionFactor] === "string" ? [rule.when[definition.versionFactor] as Version]
        : Array.isArray(rule.when[definition.versionFactor]) ? rule.when[definition.versionFactor] as Version[] : versions;
      for (const version of required) if (!pair.entries[version]) problems.push(`step "${step.id}": "${key}"가 ${version}에 없어요.`);
    }
  }
  for (const step of definition.steps) for (const flag of Object.keys(step.onlyIf ?? {})) if (!setFlags.has(flag)) problems.push(`step "${step.id}": onlyIf 플래그 "${flag}"를 설정하는 규칙이 없어요.`);
  for (const verdict of definition.verdicts) {
    if (!setFlags.has(verdict.flag)) problems.push(`verdict "${verdict.flag}"를 설정하는 규칙이 없어요.`);
    if (verdict.dependsOn && !setFlags.has(verdict.dependsOn)) problems.push(`verdict "${verdict.flag}": dependsOn 플래그 "${verdict.dependsOn}"를 설정하는 규칙이 없어요.`);
  }
  return problems;
}
