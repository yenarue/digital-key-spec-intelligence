import type { Version } from "@dksi/spec-core";
import type { AskResponse, SearchMode } from "../contracts/ask";
import { isAskResponse } from "./ask-client";

export const HISTORY_KEY = "dksi.history.v1";
export const HISTORY_LIMIT = 5;
export interface HistoryEntry {
  id: string; question: string; mode: SearchMode; versions: Version[]; topK: number;
  submittedAt: string; appVersion: string; response: AskResponse;
}
type HistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Browser-only; returns null when storage is blocked so history silently turns off. */
function browserStorage(): HistoryStorage | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}
function isEntry(value: unknown): value is HistoryEntry {
  if (value === null || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === "string" && typeof entry.question === "string" && entry.question.trim().length > 0
    && (entry.mode === "keyword" || entry.mode === "ai")
    && Array.isArray(entry.versions) && entry.versions.length > 0 && entry.versions.every(version => version === "V1" || version === "V2")
    && Number.isInteger(entry.topK) && typeof entry.submittedAt === "string" && !Number.isNaN(Date.parse(entry.submittedAt))
    && typeof entry.appVersion === "string" && isAskResponse(entry.response);
}
function sameRequest(a: Pick<HistoryEntry, "question" | "mode" | "versions">, b: Pick<HistoryEntry, "question" | "mode" | "versions">) {
  const normalize = (question: string) => question.trim().replace(/\s+/g, " ");
  return normalize(a.question) === normalize(b.question) && a.mode === b.mode
    && [...a.versions].sort().join() === [...b.versions].sort().join();
}
function write(entries: HistoryEntry[], storage: HistoryStorage | null): HistoryEntry[] {
  try {
    if (entries.length === 0) storage?.removeItem(HISTORY_KEY);
    else storage?.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch { /* Full or blocked storage keeps the in-memory list only. */ }
  return entries;
}

/** Stored data is untrusted: malformed entries are dropped, never repaired. */
export function readHistory(storage = browserStorage()): HistoryEntry[] {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isEntry).slice(0, HISTORY_LIMIT) : [];
  } catch { return []; }
}
export function addHistory(entry: Omit<HistoryEntry, "id">, storage = browserStorage()): HistoryEntry[] {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const rest = readHistory(storage).filter(existing => !sameRequest(existing, entry));
  return write([{ ...entry, id }, ...rest].slice(0, HISTORY_LIMIT), storage);
}
export function removeHistory(id: string, storage = browserStorage()): HistoryEntry[] {
  return write(readHistory(storage).filter(entry => entry.id !== id), storage);
}
export function clearHistory(storage = browserStorage()): HistoryEntry[] {
  return write([], storage);
}

const EMPTY: HistoryEntry[] = [];
const listeners = new Set<() => void>();
let snapshot: HistoryEntry[] | undefined;
/** useSyncExternalStore adapter: server render and hydration see no history, then this browser's list. */
export const historyStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => snapshot ??= readHistory(),
  getServerSnapshot: () => EMPTY,
  set(entries: HistoryEntry[]) { snapshot = entries; listeners.forEach(listener => listener()); },
};
