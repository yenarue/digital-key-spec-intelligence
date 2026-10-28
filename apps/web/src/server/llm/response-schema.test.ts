import { describe, expect, it } from "vitest";
import { evidenceFixture } from "../../test-fixtures/ask";
import { ModelOutputError, parseChatCompletion, parseGroundedAnswer } from "./response-schema";

const candidate = {
  answer: `가상 문서의 조건입니다. [${evidenceFixture.citationId}]`,
  citations: [{ citationId: evidenceFixture.citationId, quote: evidenceFixture.quote }],
};

describe("model output schema", () => {
  it("accepts only the grounded answer shape", () => {
    expect(parseGroundedAnswer(JSON.stringify(candidate))).toEqual(candidate);
    expect(parseChatCompletion({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(candidate) } }] })).toEqual(candidate);
  });
  it.each([
    "not json", "```json\n{}\n```", "null", "[]",
    JSON.stringify({ ...candidate, extra: "untrusted" }),
    JSON.stringify({ answer: "", citations: candidate.citations }),
    JSON.stringify({ answer: "답변", citations: [] }),
    JSON.stringify({ answer: "답변", citations: [{ citationId: "fabricated", quote: "text" }] }),
    JSON.stringify({ answer: "답변", citations: [{ citationId: evidenceFixture.citationId, quote: " " }] }),
    JSON.stringify({ answer: "답변", citations: [{ ...candidate.citations[0], extra: true }] }),
  ])("rejects malformed/extra/missing output %#", (value) => {
    expect(() => parseGroundedAnswer(value)).toThrow(ModelOutputError);
  });
  it.each([
    {}, { error: { message: "upstream private error" } },
    { choices: [{ finish_reason: "length", message: { content: JSON.stringify(candidate) } }] },
    { choices: [{ finish_reason: "stop", message: { content: null } }] },
    { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(candidate), refusal: "no" } }] },
  ])("rejects incomplete/refused/non-text completions %#", (value) => {
    expect(() => parseChatCompletion(value)).toThrow(ModelOutputError);
  });
});
