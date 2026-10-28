import MiniSearch, { type SearchOptions as IndexSearchOptions } from "minisearch";
import type { CorpusProvider, Retriever } from "./interfaces";
import { toEvidence } from "./evidence";
import { expandQuery } from "./synonyms";
import { VERSIONS, type Evidence, type MatchedTerm, type SearchOptions, type SourceRequirement, type Version } from "./types";

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "be", "to", "for", "in", "on", "of", "at", "by",
  "if", "or", "and", "can", "what", "how", "when", "do", "does", "with", "it", "its",
  "this", "that", "shall", "should", "may", "fictional", "demo", "v1", "v2",
  "어떤", "무엇", "무엇인가", "뭐야", "사양", "규격", "필요해", "가능한가", "있어", "있나", "할", "수",
]);

const TOKEN = /[a-z0-9]+(?:[-.][a-z0-9]+)*|[가-힣]+/gi;
const FIELDS = ["requirementId", "sectionId", "heading", "keywords", "text"];

function tokenize(text: string): string[] {
  return text.toLowerCase().match(TOKEN) ?? [];
}

function normalizeToken(token: string): string | null {
  const term = token.toLowerCase().replace(/(에서는|에서|으로|은|는|을|를|이|가|에|로)$/u, "");
  return term.length > 0 && !STOP_WORDS.has(term) ? term : null;
}

/** Locate matched index terms in the verbatim text with the same tokenizer, without altering it. */
function matchedTerms(text: string, match: Record<string, string[]>, direct = new Set<string>()): MatchedTerm[] {
  const ranges = new Map<string, [number, number][]>();
  for (const token of text.matchAll(TOKEN)) {
    const term = normalizeToken(token[0]);
    if (!term || !Object.hasOwn(match, term)) continue;
    ranges.set(term, [...ranges.get(term) ?? [], [token.index, token.index + term.length]]);
  }
  const first = (term: string) => ranges.get(term)?.[0][0] ?? Infinity;
  return Object.keys(match).sort((a, b) => first(a) - first(b) || a.localeCompare(b)).map((term) => ({
    term,
    fields: FIELDS.filter((field) => match[term].includes(field)),
    viaSynonym: !direct.has(term),
    ranges: ranges.get(term) ?? [],
  }));
}

export class MiniSearchRetriever implements Retriever {
  private readonly index: MiniSearch;
  private readonly sources = new Map<string, SourceRequirement>();

  constructor(private readonly corpus: CorpusProvider) {
    this.index = new MiniSearch({
      idField: "citationId",
      fields: FIELDS,
      storeFields: ["version"],
      tokenize,
      processTerm: normalizeToken,
      extractField: (document, field) => field === "keywords" ? document.keywords.join(" ") : document[field],
    });
    for (const source of corpus.getChunks()) this.sources.set(source.citationId, source);
    this.index.addAll([...this.sources.values()]);
  }

  searchRequirements(query: string, options: SearchOptions = {}): Evidence[] {
    if (typeof query !== "string") throw new TypeError("Query must be a string");
    const trimmed = query.trim();
    if ([...trimmed].length > 500) throw new RangeError("Query exceeds 500 characters");
    const topK = options.topK ?? 5;
    if (!Number.isInteger(topK) || topK < 1 || topK > 8) throw new RangeError("topK must be an integer from 1 to 8");
    const versions = options.versions ?? [...VERSIONS];
    if (!Array.isArray(versions) || versions.length === 0 || versions.some((version) => !VERSIONS.includes(version))) {
      throw new RangeError("versions must contain V1 or V2");
    }
    if (!trimmed) return [];
    const allowed = new Set<Version>(versions);
    const exact = [...this.sources.values()].filter((source) => allowed.has(source.version)
      && (source.citationId.toLowerCase() === trimmed.toLowerCase() || source.requirementId.toLowerCase() === trimmed.toLowerCase()));
    if (exact.length > 0) return exact.sort((a, b) => a.citationId.localeCompare(b.citationId)).slice(0, topK).map((source) => toEvidence(source, 1));

    const searchOptions: IndexSearchOptions = {
      boost: { requirementId: 8, sectionId: 3, heading: 4, keywords: 6, text: 1 },
      combineWith: "OR",
      prefix: (term) => term.length >= 3,
      fuzzy: (term) => /^[a-z]{5,}$/u.test(term) ? 0.15 : false,
      filter: (result) => allowed.has(result.version as Version),
    };
    const hits = this.index.search(expandQuery(trimmed), searchOptions)
      .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)))
      .slice(0, topK);
    // Terms the unexpanded question also matches are direct; the rest came only from synonym expansion.
    const direct = new Map(this.index.search(trimmed, searchOptions).map((hit) => [String(hit.id), new Set(Object.keys(hit.match))]));
    return hits.map((hit) => {
      const source = this.sources.get(String(hit.id))!;
      return { ...toEvidence(source, hit.score), matches: matchedTerms(source.text, hit.match, direct.get(String(hit.id))) };
    });
  }

  getRequirement(citationId: string): Evidence | undefined {
    const source = this.corpus.getSourceSpan(citationId);
    return source ? toEvidence(source) : undefined;
  }
}
