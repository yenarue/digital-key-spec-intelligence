/** Small, deterministic vocabulary expansion; this is lexical retrieval, not embeddings. */
export const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ["등록", "프로비저닝", "provisioning", "enrollment"],
  ["공유", "sharing"],
  ["재공유", "위임", "delegation", "delegated", "reshare"],
  ["폐기", "취소", "revocation", "revoked"],
  ["권한", "entitlement", "entitlements"],
  ["재시도", "retry"],
  ["태그", "접촉", "tap"],
  ["거리", "ranging", "range"],
  ["개인정보", "privacy"],
  ["로그", "logging"],
  ["만료", "expiration"],
  ["일시정지", "중단", "suspension", "suspended"],
  ["오프라인", "offline"],
  ["시동", "start"],
  ["디지털키", "디지털", "digital", "dk"],
  ["기능", "feature", "features"],
  ["용어", "개요", "overview", "terms", "definition"],
  ["변경", "차이", "비교", "changes", "differences"],
];

function matchesAlias(token: string, alias: string): boolean {
  if (/^[a-z]+$/u.test(alias)) return token === alias;
  if (!token.startsWith(alias)) return false;
  // Match common Korean particles/endings rather than arbitrary substring collisions.
  return /^(?:은|는|이|가|을|를|에|에서|에서는|으로|로|할|하면|하는|하기|의|해|하고|하려면|된|되면|된다는)*$/u.test(token.slice(alias.length));
}

export function expandQuery(query: string): string {
  const tokens = query.toLowerCase().match(/[a-z0-9]+(?:[-.][a-z0-9]+)*|[가-힣]+/gu) ?? [];
  const terms = new Set<string>();
  for (const group of SYNONYM_GROUPS) {
    if (group.some((alias) => tokens.some((token) => matchesAlias(token, alias)))) {
      for (const alias of group) {
        if (/^[a-z]+$/u.test(alias)) terms.add(alias);
      }
    }
  }
  return `${query} ${[...terms].join(" ")}`.trim();
}
