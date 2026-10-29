import type { Evidence, Version } from "@dksi/spec-core";
export type SearchMode = "keyword" | "ai";
// Omitted mode preserves the existing AI API behavior; the UI explicitly defaults to keyword.
export interface AskRequest { question: string; versions?: Version[]; topK?: number; mode?: SearchMode }
export type AskStatus = "answered" | "insufficient_evidence" | "search_only" | "llm_unavailable";
export const ASK_FAILURE_REASONS = ["timeout", "rate_limit", "citation_validation", "malformed", "response_too_large", "invalid_configuration", "unavailable"] as const;
export type AskFailureReason = typeof ASK_FAILURE_REASONS[number];
export interface AskResponse { status: AskStatus; answer: string | null; sources: Evidence[]; warnings: string[]; failureReason?: AskFailureReason }
export interface ApiError { error: { code: "invalid_request" | "payload_too_large" | "internal_error"; message: string } }
export type AskService = (request: AskRequest) => Promise<AskResponse>;
export const QUERY_MAX_LENGTH = 500;
export const REQUEST_MAX_BYTES = 8192;
