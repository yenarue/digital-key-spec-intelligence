import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getAskService } from '../server/ask-runtime';
import { corpus } from '../server/corpus';

describe('real synthetic corpus to search service', () => {
  beforeEach(() => vi.stubEnv('OPENROUTER_API_KEY', ''));
  afterEach(() => vi.unstubAllEnvs());
  it('returns exact registered V1 NFC evidence without an LLM', async () => {
    const result = await getAskService()({question:'NFC 태그로 접근할 수 있나?',versions:['V1']});
    expect(result.status).toBe('search_only');
    expect(result.answer).toBeNull();
    expect(result.sources.some(s=>s.requirementId==='DEMO-V1-REQ-011')).toBe(true);
    for (const source of result.sources) {
      expect(source.version).toBe('V1');
      expect(source.fullText).toBe(corpus.getSourceSpan(source.citationId)?.text);
      expect(source.quote).toBe(source.fullText);
    }
  });
  it('keeps actual search results for an invalid paid model configured with a key', async () => {
    vi.stubEnv('OPENROUTER_API_KEY','unit-test-not-a-real-key');
    vi.stubEnv('OPENROUTER_MODEL','paid/model');
    const fetchSpy = vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('Network must not be called'));
    try {
      const response=await getAskService()({question:'NFC',versions:['V1']});
      expect(response.status).toBe('llm_unavailable');
      expect(response.answer).toBeNull();
      expect(response.sources.length).toBeGreaterThan(0);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { fetchSpy.mockRestore(); }
  });
  it('does not invent an answer or sources for an unsupported question', async () => {
    expect(await getAskService()({question:'우주선 추진엔진 사양이 뭐야?'})).toEqual({status:'insufficient_evidence',answer:null,sources:[],warnings:[]});
  });
  it('explicit keyword mode bypasses even a keyed forbidden model at the runtime boundary', async () => {
    vi.stubEnv('OPENROUTER_API_KEY','unit-test-not-a-real-key');
    vi.stubEnv('OPENROUTER_MODEL','paid/model');
    const fetchSpy = vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('No network allowed'));
    try {
      const result = await getAskService()({question:'NFC',versions:['V1'],mode:'keyword'});
      expect(result).toMatchObject({status:'search_only',answer:null,warnings:[]});
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources.every(source=>source.version==='V1')).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { fetchSpy.mockRestore(); }
  });
});
