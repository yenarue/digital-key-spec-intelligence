import { describe, expect, it, vi } from 'vitest';
import { SourceEvidenceValidator } from '@dksi/spec-core';
import { corpus, retriever } from '../server/corpus';
import { createAskService } from '../server/ask-service';
import { OpenRouterProvider } from '../server/llm/openrouter';

const request = {question:'NFC 태그로 접근할 수 있나?',versions:['V1'] as ['V1']};
const actual = retriever.searchRequirements(request.question,{versions:request.versions});
const source = actual[0];
function setup(payload: unknown, status=200) {
  const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async()=>Response.json(payload,{status}));
  return {fetchImpl, service:createAskService({corpus,retriever,validator:new SourceEvidenceValidator(),llmProvider:new OpenRouterProvider({apiKey:'unit-test-not-a-real-key',fetchImpl})})};
}
function completion(citationId=source.citationId, quote=source.quote) {
  return {choices:[{finish_reason:'stop',message:{content:JSON.stringify({answer:`가상 문서의 조건을 확인하세요. [${citationId}]`,citations:[{citationId,quote}]})}}]};
}
describe('actual retrieval + provider parsing + original-source validation',()=>{
  it('accepts a structurally grounded candidate through the real validator',async()=>{
    const {service,fetchImpl}=setup(completion());
    const result=await service(request);
    expect(result.status).toBe('answered');
    expect(result.sources).toEqual(actual);
    expect(result.answer).toContain(`[${source.citationId}]`);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['fabricated citation',completion('SRC:DKSI-SYNTHETIC:V1:FAKE')],
    ['quote alteration',completion(source.citationId,'not in the original')],
    ['another version',completion(source.citationId.replace(':V1:',':V2:'))],
    ['malformed completion',{choices:[]}],
  ])('withholds %s and preserves all search results',async(_name,payload)=>{
    const {service}=setup(payload);
    expect(await service(request)).toMatchObject({status:'llm_unavailable',answer:null,sources:actual});
  });
  it('retains evidence on real provider 429 path and does not leak upstream text',async()=>{
    const {service,fetchImpl}=setup({error:'PRIVATE_UPSTREAM_BODY'},429);
    const result=await service(request);
    expect(result).toMatchObject({status:'llm_unavailable',answer:null,sources:actual});
    expect(JSON.stringify(result)).not.toContain('PRIVATE_UPSTREAM_BODY');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it('does not call a configured provider when no evidence exists',async()=>{
    const {service,fetchImpl}=setup(completion());
    expect(await service({question:'우주선 추진엔진 사양이 뭐야?'})).toMatchObject({status:'insufficient_evidence',answer:null,sources:[]});
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it('changes only generation between modes: identical exact sources, zero keyword calls and one AI call',async()=>{
    const {service,fetchImpl}=setup(completion());
    const keyword=await service({...request,mode:'keyword'});
    expect(keyword).toEqual({status:'search_only',answer:null,sources:actual,warnings:[]});
    expect(fetchImpl).not.toHaveBeenCalled();
    const ai=await service({...request,mode:'ai'});
    expect(ai.status).toBe('answered');
    expect(ai.sources).toEqual(keyword.sources);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const legacy=await service(request);
    expect(legacy).toEqual(ai);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
