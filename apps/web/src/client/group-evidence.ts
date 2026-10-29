import type { Evidence } from "@dksi/spec-core";

export type EvidenceGroup = { key: string; items: Evidence[] };
/** The version token is part of the requirement ID (DEMO-V1-REQ-004), so strip it to find the same requirement in another version. */
function versionlessKey(evidence: Evidence): string {
  return [evidence.documentId, evidence.sectionId, evidence.requirementId.split(`-${evidence.version}-`).join("-")].join("|");
}
/** Groups the same requirement across versions into one entry, keeping rank order (first appearance) and V1 before V2 inside a group. Never merges two items of the same version. */
export function groupEvidence(sources: readonly Evidence[]): EvidenceGroup[] {
  const groups: EvidenceGroup[] = [];
  for (const source of sources) {
    const key = versionlessKey(source);
    const group = groups.find(candidate => candidate.key === key && !candidate.items.some(item => item.version === source.version));
    if (group) group.items.push(source);
    else groups.push({ key, items: [source] });
  }
  for (const group of groups) group.items.sort((a, b) => a.version.localeCompare(b.version));
  return groups;
}
