import type { Evidence, Version } from "@dksi/spec-core";
export interface AskRequest { question: string; versions?: Version[]; topK?: number }
export type AskStatus = "answered" | "insufficient_evidence" | "search_only" | "llm_unavailable";
export interface AskResponse { status: AskStatus; answer: string | null; sources: Evidence[]; warnings: string[] }
export interface ApiError { error: { code: "invalid_request" | "payload_too_large" | "internal_error"; message: string } }
export type AskService = (request: AskRequest) => Promise<AskResponse>;
export const QUERY_MAX_LENGTH = 500;
export const REQUEST_MAX_BYTES = 8192;
