import 'server-only';
import { SourceEvidenceValidator } from '@dksi/spec-core';
import type { AskService } from '../contracts/ask';
import { createAskService } from './ask-service';
import { corpus, retriever } from './corpus';
import { OpenRouterProvider } from './llm/openrouter';

const validator = new SourceEvidenceValidator();
/** Only this server composition boundary reads model credentials. */
export function getAskService(): AskService {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  return createAskService({
    corpus, retriever, validator,
    llmProvider: apiKey ? new OpenRouterProvider({ apiKey, model: process.env.OPENROUTER_MODEL || 'openrouter/free' }) : undefined,
  });
}
