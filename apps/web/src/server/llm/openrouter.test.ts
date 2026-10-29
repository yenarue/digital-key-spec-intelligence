import { describe, expect, it, vi } from "vitest";
import { evidenceFixture } from "../../test-fixtures/ask";
import { OpenRouterProvider, isFreeModel, LLMProviderError, MAX_OUTPUT_TOKENS, RESPONSE_MAX_BYTES, MODEL_TIMEOUT_MS } from "./openrouter";

import { maxDuration } from "../../app/api/ask/route";

const candidate = { answer: `가상 NFC 조건입니다. [${evidenceFixture.citationId}]`, citations: [{ citationId: evidenceFixture.citationId, quote: evidenceFixture.quote }] };
const input = { question: "NFC 조건", evidence: [evidenceFixture], locale: "ko" as const };
function completion(content = JSON.stringify(candidate)) {
  return Response.json({ choices: [{ finish_reason: "stop", message: { content } }] });
}
function providerWith(fetchMock: ReturnType<typeof vi.fn>, overrides = {}) {
  return new OpenRouterProvider({ apiKey: "test-secret-not-real", fetchImpl: fetchMock as typeof fetch, ...overrides });
}

describe("free OpenRouter provider", () => {
  it("sends only selected synthetic context in one bounded request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion());
    expect(await providerWith(fetchMock).generateGroundedAnswer(input)).toEqual(candidate);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("openrouter/free");
    expect(body.models).toBeUndefined();
    expect(body.max_tokens).toBe(MAX_OUTPUT_TOKENS);
    expect(body.stream).toBe(false);
    const context = JSON.parse(body.messages[1].content);
    expect(context.evidence).toHaveLength(1);
    expect(context.evidence[0]).toMatchObject({ citationId: evidenceFixture.citationId, text: evidenceFixture.fullText });
    expect(body.messages[0].content).toContain("실제 CCC");
    expect(body.messages[0].content).toContain("신뢰할 수 없는 데이터");
    expect(init.redirect).toBe("error");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.stringify(body)).not.toContain("test-secret-not-real");
  });
  it.each(["openai/gpt-4", "auto", "provider/model:free/paid", "provider/model:free?paid=true", " provider/model:free", "https://other/model:free"])("refuses non-free/malformed model %s without a call", async (model) => {
    const fetchMock = vi.fn();
    await expect(providerWith(fetchMock, { model }).generateGroundedAnswer(input)).rejects.toMatchObject({ reason: "invalid_configuration" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("allows pinned free variants only", () => {
    expect(isFreeModel("meta-llama/llama-3.3-70b-instruct:free")).toBe(true);
    expect(isFreeModel("openrouter/free")).toBe(true);
  });
  it.each([[429, "rate_limit"], [401, "unavailable"], [500, "unavailable"]])("handles HTTP %s without leaking body or retrying", async (status, reason) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("secret upstream body", { status: status as number }));
    await expect(providerWith(fetchMock).generateGroundedAnswer(input)).rejects.toMatchObject({ reason, message: "AI 답변을 가져올 수 없습니다." });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("sanitizes network errors", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("test-secret-not-real debug"));
    await expect(providerWith(fetchMock).generateGroundedAnswer(input)).rejects.toMatchObject({ reason: "unavailable" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("rejects malformed model output and malformed envelope", async () => {
    await expect(providerWith(vi.fn().mockResolvedValue(completion("not JSON"))).generateGroundedAnswer(input)).rejects.toMatchObject({ reason: "malformed" });
    await expect(providerWith(vi.fn().mockResolvedValue(new Response("{"))).generateGroundedAnswer(input)).rejects.toMatchObject({ reason: "malformed" });
  });
  it("enforces streamed response size without trusting Content-Length", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("x".repeat(RESPONSE_MAX_BYTES + 1)));
    await expect(providerWith(fetchMock).generateGroundedAnswer(input)).rejects.toMatchObject({ reason: "response_too_large" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("times out a stalled fetch even when a test transport ignores AbortSignal", async () => {
    const fetchMock = vi.fn().mockImplementation(() => new Promise(() => undefined));
    await expect(providerWith(fetchMock, { timeoutMs: 10 }).generateGroundedAnswer(input)).rejects.toMatchObject({ reason: "timeout" });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("keeps timeout active while reading a stalled response body", async () => {
    const cancel = vi.fn();
    const stalled = new ReadableStream<Uint8Array>({ start() {}, cancel });
    const fetchMock = vi.fn().mockResolvedValue(new Response(stalled));
    await expect(providerWith(fetchMock, { timeoutMs: 10 }).generateGroundedAnswer(input)).rejects.toMatchObject({ reason: "timeout" });
    expect(cancel).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
  it("accepts a valid completion after the former ninety-second deadline", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>(resolve => {
        setTimeout(() => resolve(completion()), 100_000);
      }));
      const outcome = providerWith(fetchMock).generateGroundedAnswer(input)
        .then(answer => ({ answer }), error => ({ reason: error.reason }));
      await vi.advanceTimersByTimeAsync(100_000);
      expect(await outcome).toEqual({ answer: candidate });
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });
  it("accepts a response body that completes after ten seconds", async () => {
    vi.useFakeTimers();
    try {
      const body = new ReadableStream<Uint8Array>({ start(controller) {
        setTimeout(() => { controller.enqueue(new TextEncoder().encode(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(candidate) } }] }))); controller.close(); }, 20_000);
      } });
      const fetchMock = vi.fn().mockResolvedValue(new Response(body));
      const outcome = providerWith(fetchMock).generateGroundedAnswer(input)
        .then(answer => ({ answer }), error => ({ reason: error.reason }));
      await vi.advanceTimersByTimeAsync(20_000);
      expect(await outcome).toEqual({ answer: candidate });
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });
  it("still aborts at the bounded deadline and clamps excessive timeout settings", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn().mockImplementation(() => new Promise(() => undefined));
      const outcome = providerWith(fetchMock, { timeoutMs: 600_000 }).generateGroundedAnswer(input)
        .then(() => "unexpected success", error => error.reason);
      await vi.advanceTimersByTimeAsync(MODEL_TIMEOUT_MS - 1);
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      expect(init.signal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await outcome).toBe("timeout");
      expect(init.signal?.aborted).toBe(true);
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });
  it("cancels a stalled body at the default deadline without retrying", async () => {
    vi.useFakeTimers();
    try {
      const cancel = vi.fn();
      const body = new ReadableStream<Uint8Array>({ start() {}, cancel });
      const fetchMock = vi.fn().mockResolvedValue(new Response(body));
      const outcome = providerWith(fetchMock).generateGroundedAnswer(input)
        .then(() => "unexpected success", error => error.reason);
      await vi.advanceTimersByTimeAsync(MODEL_TIMEOUT_MS);
      expect(await outcome).toBe("timeout");
      expect(cancel).toHaveBeenCalledOnce();
      expect(fetchMock).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });
  it("leaves a platform execution cushion beyond the model deadline", () => {
    expect(MODEL_TIMEOUT_MS).toBeGreaterThan(10_000);
    expect(MODEL_TIMEOUT_MS).toBeLessThan(maxDuration * 1000);
  });
  it("does not call the API for missing key or no evidence", async () => {
    const fetchMock = vi.fn();
    await expect(providerWith(fetchMock, { apiKey: "" }).generateGroundedAnswer(input)).rejects.toBeInstanceOf(LLMProviderError);
    await expect(providerWith(fetchMock).generateGroundedAnswer({ ...input, evidence: [] })).rejects.toBeInstanceOf(LLMProviderError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
