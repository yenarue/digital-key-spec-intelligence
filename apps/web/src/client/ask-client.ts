import type { AskRequest, AskResponse } from "../contracts/ask";

export function questionLength(question: string): number { return Array.from(question.trim()).length; }
export function questionError(question: string): string | null {
  const length = questionLength(question);
  if (length === 0) return "찾고 싶은 조건이나 예외를 질문해주세요.";
  if (length > 500) return "질문은 500자 이내로 입력해주세요.";
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
    throw new Error("요청을 완료하지 못했어요. 연결을 확인하고 다시 시도해주세요.");
  }
  let body: unknown;
  try { body = await response.json(); }
  catch { throw new Error("결과를 읽지 못했어요. 잠시 후 다시 시도해주세요."); }
  if (!response.ok) {
    throw new Error(response.status === 400 || response.status === 413
      ? "질문과 문서 버전을 확인하고 다시 시도해주세요."
      : "요청을 완료하지 못했어요. 잠시 후 다시 시도해주세요.");
  }
  if (!isAskResponse(body)) throw new Error("결과를 읽지 못했어요. 잠시 후 다시 시도해주세요.");
  return body;
}
