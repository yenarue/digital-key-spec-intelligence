import type { GroundedAnswer } from "@dksi/spec-core";

export class ModelOutputError extends Error {
  constructor() { super("모델 응답 형식을 확인할 수 없습니다."); this.name = "ModelOutputError"; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Parsing only checks shape. Source identity and logical support are separate checks. */
export function parseGroundedAnswer(content: string): GroundedAnswer {
  let value: unknown;
  try { value = JSON.parse(content) as unknown; } catch { throw new ModelOutputError(); }
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== "answer,citations" ||
    typeof value.answer !== "string" || value.answer.trim().length === 0 ||
    Array.from(value.answer).length > 6000 || !Array.isArray(value.citations) ||
    value.citations.length < 1 || value.citations.length > 24) throw new ModelOutputError();
  const citations = value.citations.map((citation) => {
    if (!isRecord(citation) || Object.keys(citation).sort().join(",") !== "citationId,quote" ||
      typeof citation.citationId !== "string" || !citation.citationId.startsWith("SRC:") ||
      citation.citationId.length > 256 || typeof citation.quote !== "string" ||
      citation.quote.trim().length === 0 || citation.quote.length > 8000) throw new ModelOutputError();
    return { citationId: citation.citationId, quote: citation.quote };
  });
  return { answer: value.answer, citations };
}

export function parseChatCompletion(value: unknown): GroundedAnswer {
  if (!isRecord(value) || !Array.isArray(value.choices) || value.choices.length !== 1) throw new ModelOutputError();
  const choice: unknown = value.choices[0];
  if (!isRecord(choice) || choice.finish_reason !== "stop" || !isRecord(choice.message) ||
    typeof choice.message.content !== "string" || choice.message.refusal) throw new ModelOutputError();
  return parseGroundedAnswer(choice.message.content);
}
