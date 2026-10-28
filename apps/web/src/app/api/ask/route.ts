import { REQUEST_MAX_BYTES, type ApiError, type AskResponse } from "../../../contracts/ask";
import { getAskService } from "../../../server/ask-runtime";
import { RequestValidationError, validateAskRequest } from "../../../server/request-validation";

export const runtime = "nodejs";
export const maxDuration = 15;

class PayloadTooLargeError extends Error {}

function json(body: AskResponse | ApiError, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function readLimitedBody(request: Request): Promise<unknown> {
  const declaredSize = request.headers.get("content-length");
  if (declaredSize !== null && Number(declaredSize) > REQUEST_MAX_BYTES) {
    throw new PayloadTooLargeError();
  }
  if (!request.body) throw new RequestValidationError("JSON 형식으로 질문을 보내주세요.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > REQUEST_MAX_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new PayloadTooLargeError();
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) throw error;
    throw new RequestValidationError("JSON 형식으로 질문을 보내주세요.");
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Reject browser drive-by submissions; this is not authentication or global rate limiting.
    const origin = request.headers.get("origin");
    const internalURL = new URL(request.url);
    // Next may normalize request.url to localhost behind its Node/Vercel adapter.
    // Host reflects the public request authority; Vercel supplies forwarded TLS scheme.
    const host = request.headers.get("host") || internalURL.host;
    const forwardedProtocol = request.headers.get("x-forwarded-proto");
    const protocol = forwardedProtocol === "https" || forwardedProtocol === "http"
      ? `${forwardedProtocol}:` : internalURL.protocol;
    const publicOrigin = new URL(`${protocol}//${host}`).origin;
    if (origin !== null && origin !== publicOrigin) {
      throw new RequestValidationError("같은 사이트에서 질문을 보내주세요.");
    }
    const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (contentType !== "application/json") {
      throw new RequestValidationError("JSON 형식으로 질문을 보내주세요.");
    }
    const input = validateAskRequest(await readLimitedBody(request));
    return json(await getAskService()(input));
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return json({ error: { code: "payload_too_large", message: "요청 크기가 너무 큽니다. 질문을 줄여주세요." } }, 413);
    }
    if (error instanceof RequestValidationError) {
      return json({ error: { code: "invalid_request", message: error.message } }, 400);
    }
    return json({ error: { code: "internal_error", message: "요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요." } }, 500);
  }
}
