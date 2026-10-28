import type { AskRequest, AskResponse } from "../contracts/ask";
import { uiText } from "../content/ui-text";

const errors = uiText.errors;

export function questionLength(question: string): number { return Array.from(question.trim()).length; }
export function questionError(question: string): string | null {
  const length = questionLength(question);
  if (length === 0) return errors.questionEmpty;
  if (length > 500) return errors.questionTooLong;
  return null;
}
function isEvidence(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  const source = value as Record<string, unknown>;
  return ["citationId", "documentId", "documentTitle", "sectionId", "requirementId", "quote", "fullText"]
    .every(field => typeof source[field] === "string" && source[field].length > 0)
    && (source.version === "V1" || source.version === "V2")
    && (source.heading === undefined || typeof source.heading === "string");
}
function isAskResponse(value: unknown): value is AskResponse {
  if (value === null || typeof value !== "object") return false;
  const response = value as Partial<AskResponse>;
  return ["answered", "insufficient_evidence", "search_only", "llm_unavailable"].includes(response.status ?? "")
    && (response.answer === null || typeof response.answer === "string")
    && Array.isArray(response.sources) && response.sources.every(isEvidence) && Array.isArray(response.warnings)
    && response.warnings.every(warning => typeof warning === "string");
}
export async function askQuestion(request: AskRequest, options: { signal?: AbortSignal; fetcher?: typeof fetch } = {}): Promise<AskResponse> {
  const error = questionError(request.question);
  if (error) throw new Error(error);
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)("/api/ask", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...request, question: request.question.trim() }),
      signal: options.signal, cache: "no-store",
    });
  } catch (caught) {
    if (options.signal?.aborted) throw caught;
    throw new Error(errors.network);
  }
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new Error(errors.unreadable); }
  if (!response.ok) {
    throw new Error(response.status === 400 || response.status === 413
      ? errors.badRequest
      : errors.generic);
  }
  if (!isAskResponse(body)) throw new Error(errors.unreadable);
  return body;
}
