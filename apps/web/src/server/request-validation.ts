import { VERSIONS, type Version } from "@dksi/spec-core";
import { QUERY_MAX_LENGTH, type AskRequest } from "../contracts/ask";

export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

export function validateAskRequest(value: unknown): AskRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("질문과 문서 버전을 올바른 형식으로 입력해주세요.");
  }
  const input = value as Record<string, unknown>;
  if (typeof input.question !== "string") {
    throw new RequestValidationError("질문을 입력해주세요.");
  }
  const question = input.question.trim();
  if (Array.from(question).length < 1 || Array.from(question).length > QUERY_MAX_LENGTH) {
    throw new RequestValidationError("질문은 공백을 제외한 앞뒤 정리 후 1~500자로 입력해주세요.");
  }

  let versions: Version[] = [...VERSIONS];
  if (input.versions !== undefined) {
    if (!Array.isArray(input.versions) || input.versions.length === 0 ||
      !input.versions.every((version) => VERSIONS.includes(version as Version))) {
      throw new RequestValidationError("문서 버전은 V1 또는 V2 중에서 선택해주세요.");
    }
    versions = [...new Set(input.versions as Version[])];
  }

  const topK = input.topK === undefined ? 5 : input.topK;
  if (typeof topK !== "number" || !Number.isInteger(topK) || topK < 1 || topK > 8) {
    throw new RequestValidationError("검색 결과 개수는 1~8 사이의 정수여야 합니다.");
  }
  // Preserve the generation behavior of clients created before mode selection.
  const mode = input.mode === undefined ? "ai" : input.mode;
  if (mode !== "keyword" && mode !== "ai") {
    throw new RequestValidationError("검색 방식은 keyword 또는 ai 중에서 선택해주세요.");
  }
  return { question, versions, topK, mode };
}
