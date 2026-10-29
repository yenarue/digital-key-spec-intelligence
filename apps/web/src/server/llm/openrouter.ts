import "server-only";
import type { GroundedAnswer, LLMProvider } from "@dksi/spec-core";
import { createGroundedMessages } from "./prompt";
import { ModelOutputError, parseChatCompletion } from "./response-schema";

export type LLMFailureReason = "rate_limit" | "timeout" | "unavailable" | "malformed" | "response_too_large" | "invalid_configuration";
export class LLMProviderError extends Error {
  constructor(readonly reason: LLMFailureReason) {
    super("AI 답변을 가져올 수 없습니다.");
    this.name = "LLMProviderError";
  }
}
export interface OpenRouterOptions {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}
export const MODEL_DEFAULT = "openrouter/free";
export const RESPONSE_MAX_BYTES = 65536;
// OpenRouter counts reasoning and visible JSON against this shared limit.
export const MAX_OUTPUT_TOKENS = 8000;
// Whole-response budget: free reasoning models need room beyond a ten-second cutoff.
export const MODEL_TIMEOUT_MS = 180_000;

export function isFreeModel(model: string): boolean {
  return model === MODEL_DEFAULT || /^[a-zA-Z0-9][a-zA-Z0-9._-]*\/[a-zA-Z0-9][a-zA-Z0-9._-]*:free$/.test(model);
}

export class OpenRouterProvider implements LLMProvider {
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  constructor(private readonly options: OpenRouterOptions) {
    this.model = options.model ?? MODEL_DEFAULT;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = Number.isFinite(options.timeoutMs) ? Math.min(MODEL_TIMEOUT_MS, Math.max(1, options.timeoutMs!)) : MODEL_TIMEOUT_MS;
  }

  async generateGroundedAnswer(input: Parameters<LLMProvider["generateGroundedAnswer"]>[0]): Promise<GroundedAnswer> {
    if (!this.options.apiKey.trim() || !isFreeModel(this.model) || input.evidence.length < 1 || input.evidence.length > 8) {
      throw new LLMProviderError("invalid_configuration");
    }
    const controller = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        void reader?.cancel().catch(() => undefined);
        reject(new LLMProviderError("timeout"));
      }, this.timeoutMs);
    });
    const operation = async (): Promise<GroundedAnswer> => {
      const response = await this.fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${this.options.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: createGroundedMessages(input.question, input.evidence),
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0.1,
          response_format: { type: "json_object" },
          stream: false,
        }),
        signal: controller.signal,
        redirect: "error",
        cache: "no-store",
      });
      if (!response.ok) {
        void response.body?.cancel().catch(() => undefined);
        throw new LLMProviderError(response.status === 429 ? "rate_limit" : "unavailable");
      }
      const declaredSize = Number(response.headers.get("content-length"));
      if (declaredSize > RESPONSE_MAX_BYTES) {
        void response.body?.cancel().catch(() => undefined);
        throw new LLMProviderError("response_too_large");
      }
      if (!response.body) throw new LLMProviderError("malformed");
      reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8", { fatal: true });
      let bytes = 0;
      let text = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > RESPONSE_MAX_BYTES) {
            void reader.cancel().catch(() => undefined);
            throw new LLMProviderError("response_too_large");
          }
          text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
        let payload: unknown;
        try { payload = JSON.parse(text) as unknown; } catch { throw new LLMProviderError("malformed"); }
        return parseChatCompletion(payload);
      } finally {
        reader.releaseLock();
        reader = undefined;
      }
    };
    try {
      return await Promise.race([operation(), deadline]);
    } catch (error) {
      if (error instanceof LLMProviderError) throw error;
      if (controller.signal.aborted) throw new LLMProviderError("timeout");
      if (error instanceof ModelOutputError || error instanceof SyntaxError || error instanceof TypeError && error.message.includes("encoded")) {
        throw new LLMProviderError("malformed");
      }
      throw new LLMProviderError("unavailable");
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
