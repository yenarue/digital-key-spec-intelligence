import { describe, expect, it, vi } from "vitest";
import { askQuestion, questionError, questionLength } from "./ask-client";

describe("question validation", () => {
  it("counts Unicode code points after trim and preserves Korean", () => {
    expect(questionLength("  안녕 😀  ")).toBe(4);
    expect(questionError("  ")).toBeTruthy();
    expect(questionError("가".repeat(500))).toBeNull();
    expect(questionError("가".repeat(501))).toBeTruthy();
  });
});
describe("ask client", () => {
  it("posts the submitted version and trimmed question without extra requests", async () => {
    const result = { status: "search_only", answer: null, sources: [], warnings: [] };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(result), { status: 200 }));
    expect(await askQuestion({ question: " NFC 조건 ", versions: ["V2"], topK: 5 }, { fetcher })).toEqual(result);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({ question: "NFC 조건", versions: ["V2"], topK: 5 });
  });
  it("keeps network and invalid JSON failures user-readable", async () => {
    const network = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("internal network detail"));
    await expect(askQuestion({ question: "NFC" }, { fetcher: network })).rejects.toThrow("연결을 확인");
    const html = vi.fn<typeof fetch>().mockResolvedValue(new Response("<html>server error</html>"));
    await expect(askQuestion({ question: "NFC" }, { fetcher: html })).rejects.toThrow("결과를 읽지 못했어요");
    const malformed = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ status: "search_only", answer: null, sources: [null], warnings: [] })));
    await expect(askQuestion({ question: "NFC" }, { fetcher: malformed })).rejects.toThrow("결과를 읽지 못했어요");
  });
  it("does not send invalid input or blindly accept malformed response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ unexpected: true })));
    await expect(askQuestion({ question: " " }, { fetcher })).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    await expect(askQuestion({ question: "NFC" }, { fetcher })).rejects.toThrow("결과를 읽지 못했어요");
  });
});
