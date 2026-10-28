import { describe, expect, it } from "vitest";
import { addHistory, clearHistory, HISTORY_KEY, readHistory, removeHistory, type HistoryEntry } from "./history";
import { emptyFixture, searchOnlyFixture } from "../test-fixtures/ask";

function memoryStorage(initial?: string) {
  const data = new Map<string, string>(initial === undefined ? [] : [[HISTORY_KEY, initial]]);
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
}
const entry = (question: string, overrides: Partial<Omit<HistoryEntry, "id">> = {}): Omit<HistoryEntry, "id"> => ({
  question, mode: "keyword", versions: ["V1", "V2"], topK: 5,
  submittedAt: "2026-10-29T05:00:00.000Z", appVersion: "0.2.0", response: searchOnlyFixture, ...overrides,
});

describe("browser-local question history", () => {
  it("keeps the newest five, newest first, and survives a re-read", () => {
    const storage = memoryStorage();
    for (const n of [1, 2, 3, 4, 5, 6]) addHistory(entry(`질문 ${n}`), storage);
    expect(readHistory(storage).map(item => item.question)).toEqual(["질문 6", "질문 5", "질문 4", "질문 3", "질문 2"]);
  });
  it("replaces a repeat of the same question, mode and versions but keeps other modes and scopes", () => {
    const storage = memoryStorage();
    addHistory(entry("NFC 조건"), storage);
    addHistory(entry("NFC 조건", { mode: "ai" }), storage);
    addHistory(entry("NFC 조건", { versions: ["V2"] }), storage);
    addHistory(entry("  NFC   조건 ", { versions: ["V2", "V1"], response: emptyFixture }), storage);
    const items = readHistory(storage);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ versions: ["V2", "V1"], response: emptyFixture });
  });
  it("removes one entry and clears all", () => {
    const storage = memoryStorage();
    addHistory(entry("하나"), storage);
    const [second] = addHistory(entry("둘"), storage);
    expect(removeHistory(second.id, storage).map(item => item.question)).toEqual(["하나"]);
    expect(clearHistory(storage)).toEqual([]);
    expect(storage.data.has(HISTORY_KEY)).toBe(false);
  });
  it("drops malformed stored data instead of trusting it", () => {
    expect(readHistory(memoryStorage("{not json"))).toEqual([]);
    expect(readHistory(memoryStorage(JSON.stringify({ question: "x" })))).toEqual([]);
    const valid = { ...entry("정상"), id: "a" };
    const forged = { ...entry("위조"), id: "b", response: { status: "answered", answer: "<img>", sources: [{ citationId: 1 }], warnings: [] } };
    const badMode = { ...entry("모드"), id: "c", mode: "admin" };
    expect(readHistory(memoryStorage(JSON.stringify([forged, valid, badMode, null])))).toEqual([valid]);
  });
  it("keeps working when storage is unavailable or full", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(readHistory(blocked)).toEqual([]);
    expect(addHistory(entry("저장 불가"), blocked).map(item => item.question)).toEqual(["저장 불가"]);
    expect(clearHistory(blocked)).toEqual([]);
    expect(readHistory(null)).toEqual([]);
  });
});
