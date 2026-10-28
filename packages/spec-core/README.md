# Shared Spec Core

프레임워크 독립 TypeScript 코어. Next.js, OpenRouter, 환경변수, 브라우저 전역에 의존하지 않는다.

- `SyntheticCorpusProvider(documents)`: 합성 V1/V2 스키마·고유 ID·같은 버전 참조를 검사하고 외부 변경과 원문 registry를 분리한다.
- `MiniSearchRetriever(corpus)`: lexical full-text 색인, 버전 필터, topK 1–8(기본 5), field boosts, 보수적 prefix/fuzzy, 정적 한영 동의어를 제공한다.
- `searchRequirements(query, options)` / `getRequirement(citationId)`는 실제 원문과 stable `SRC:document:version:requirement` ID를 반환한다.
- `SourceEvidenceValidator` / `validateCitations(candidate,evidence,corpus)`: 검색 allowlist와 원본 registry에 ID·버전·문서·quote를 대조한다. 본문 인용과 모델 목록이 다르면 거부한다. **출처 일치는 논리적 함의의 증명이 아니다.**
- `CorpusProvider`, `Retriever`, `LLMProvider`, `EvidenceValidator` 인터페이스만 공유하고 실제 LLM adapter는 Web 서버에 둔다.

루트에서 `npm run test`, `npm run eval`을 실행한다. 기존 10개 평가와 추가 표현 변형/무관 질문 8개를 사용하며 코퍼스·원래 기대 ID를 변경하지 않았다. PDF/Local MCP는 구현하지 않았다.
