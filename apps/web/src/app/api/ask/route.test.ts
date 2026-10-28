import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchOnlyFixture } from "../../../test-fixtures/ask";

const { service, runtimeFactory } = vi.hoisted(() => ({ service: vi.fn(), runtimeFactory: vi.fn() }));
vi.mock("../../../server/ask-runtime", () => ({ getAskService: runtimeFactory }));
import { POST } from "./route";

function request(body: unknown): Request {
  return new Request("http://localhost/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

describe("POST /api/ask", () => {
  beforeEach(() => {
    service.mockReset().mockResolvedValue(searchOnlyFixture);
    runtimeFactory.mockReset().mockReturnValue(service);
  });
  it("returns the service result without caching and forwards normalized input", async () => {
    const response = await POST(request({ question: "  NFC  ", versions: ["V2"] }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(searchOnlyFixture);
    expect(service).toHaveBeenCalledExactlyOnceWith({ question: "NFC", versions: ["V2"], topK: 5 });
  });
  it.each([{}, { question: "" }, { question: "NFC", versions: ["V3"] }, { question: "NFC", topK: 9 }])("rejects invalid input before constructing the service %#", async (value) => {
    const response = await POST(request(value));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("invalid_request");
    expect(runtimeFactory).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON without exposing parser details", async () => {
    const response = await POST(new Request("http://localhost/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{secret" }));
    expect(response.status).toBe(400);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
    expect(runtimeFactory).not.toHaveBeenCalled();
  });
  it("enforces actual UTF-8 byte limit even without Content-Length", async () => {
    const response = await POST(request({ question: "가".repeat(3000) }));
    expect(response.status).toBe(413);
    expect((await response.json()).error.code).toBe("payload_too_large");
    expect(runtimeFactory).not.toHaveBeenCalled();
  });
  it("enforces streaming limit and cancels the oversized stream", async () => {
    const cancel = vi.fn();
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) { controller.enqueue(encoder.encode(" ".repeat(4096))); controller.enqueue(encoder.encode(" ".repeat(4097))); },
      cancel,
    });
    const streamed = new Request("http://localhost/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body, duplex: "half" } as RequestInit);
    expect((await POST(streamed)).status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    expect(runtimeFactory).not.toHaveBeenCalled();
  });
  it("rejects an oversized declared body before reading it", async () => {
    const response = await POST(new Request("http://localhost/api/ask", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": "8193" }, body: "{}" }));
    expect(response.status).toBe(413);
    expect(runtimeFactory).not.toHaveBeenCalled();
  });
  it("rejects cross-origin browser requests before service creation", async () => {
    const response = await POST(new Request("http://localhost/api/ask", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://other.example" }, body: JSON.stringify({ question: "NFC" }) }));
    expect(response.status).toBe(400);
    expect(runtimeFactory).not.toHaveBeenCalled();
  });
  it("accepts same-origin JSON with charset", async () => {
    const response = await POST(new Request("http://localhost/api/ask", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", Origin: "http://localhost" }, body: JSON.stringify({ question: "NFC" }) }));
    expect(response.status).toBe(200);
  });
  it.each([
    ["http://127.0.0.1:3100", "127.0.0.1:3100", "http"],
    ["https://demo.example", "demo.example", "https"],
  ])("accepts public authority %s when Next normalizes its internal URL", async (origin, host, protocol) => {
    const response = await POST(new Request("http://localhost:3100/api/ask", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: origin, Host: host, "X-Forwarded-Proto": protocol },
      body: JSON.stringify({ question: "NFC" }),
    }));
    expect(response.status).toBe(200);
  });
  it("still rejects another origin when public host differs from internal host", async () => {
    const response = await POST(new Request("http://localhost:3100/api/ask", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: "https://other.example", Host: "demo.example", "X-Forwarded-Proto": "https" },
      body: JSON.stringify({ question: "NFC" }),
    }));
    expect(response.status).toBe(400);
    expect(runtimeFactory).not.toHaveBeenCalled();
  });
  it("rejects text/plain drive-by form submissions", async () => {
    const response = await POST(new Request("http://localhost/api/ask", { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ question: "NFC" }) }));
    expect(response.status).toBe(400);
    expect(runtimeFactory).not.toHaveBeenCalled();
  });
  it("does not expose internal errors or credentials", async () => {
    service.mockRejectedValue(new Error("sk-or-v1-test-secret upstream debug"));
    const response = await POST(request({ question: "NFC" }));
    expect(response.status).toBe(500);
    const result = JSON.stringify(await response.json());
    expect(result).not.toMatch(/sk-or|upstream|debug/);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
