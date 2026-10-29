import { wordSimilarity } from "./text-diff";
import { VERSIONS, type SpecDocument, type Version } from "./types";

export interface OverviewEntry { version: Version; requirementId: string; citationId: string; text: string }
export interface OverviewPair {
  /** The requirement ID with its version token removed (DEMO-V1-REQ-004 and DEMO-V2-REQ-004 share `DEMO-REQ-004`). */
  key: string;
  sectionId: string; heading: string; keywords: string[];
  entries: Partial<Record<Version, OverviewEntry>>;
  /** `added`/`removed` mean present in only the newest/oldest compared version. */
  status: "changed" | "unchanged" | "added" | "removed";
  /** Word-level similarity between the oldest and newest entry; null when only one version has it. */
  similarity: number | null;
}
export interface SpecOverview { versions: Version[]; pairs: OverviewPair[] }

export function versionlessKey(requirementId: string, version: Version): string {
  return requirementId.split(`-${version}-`).join("-");
}
function compareSections(a: string, b: string): number {
  const left = a.split(".").map(Number), right = b.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const delta = (left[index] ?? -1) - (right[index] ?? -1);
    if (delta !== 0) return Number.isNaN(delta) ? a.localeCompare(b) : delta;
  }
  return 0;
}
/** Pairs the same requirement across versions and measures how much it changed. Pure and corpus-agnostic, so a real spec in the same shape works unchanged. */
export function buildOverview(documents: readonly SpecDocument[]): SpecOverview {
  const versions = VERSIONS.filter(version => documents.some(document => document.version === version));
  const byKey = new Map<string, OverviewPair>();
  for (const document of documents) {
    for (const requirement of document.requirements) {
      const key = versionlessKey(requirement.requirementId, document.version);
      const pairKey = `${document.documentId}|${requirement.sectionId}|${key}`;
      const pair = byKey.get(pairKey) ?? { key, sectionId: requirement.sectionId, heading: requirement.heading, keywords: [], entries: {}, status: "unchanged", similarity: null };
      pair.entries[document.version] = { version: document.version, requirementId: requirement.requirementId,
        citationId: `SRC:${document.documentId}:${document.version}:${requirement.requirementId}`, text: requirement.text };
      pair.keywords = [...new Set([...pair.keywords, ...requirement.keywords])];
      byKey.set(pairKey, pair);
    }
  }
  const oldest = versions[0], newest = versions[versions.length - 1];
  const pairs = [...byKey.values()].map(pair => {
    const from = pair.entries[oldest], to = pair.entries[newest];
    if (from && to && oldest !== newest) {
      const similarity = from.text === to.text ? 1 : wordSimilarity(from.text, to.text);
      return { ...pair, similarity, status: similarity === 1 ? "unchanged" as const : "changed" as const };
    }
    if (to && versions.length > 1) return { ...pair, status: "added" as const };
    if (from && versions.length > 1) return { ...pair, status: "removed" as const };
    return pair;
  });
  return { versions, pairs: pairs.sort((a, b) => compareSections(a.sectionId, b.sectionId)) };
}
