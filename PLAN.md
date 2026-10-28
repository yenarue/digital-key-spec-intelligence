# Web MVP A–E 실행 계획

작성일: 2026-10-29. 목표는 같은 날 수업에서 시연할 수 있는 **합성 데이터 기반 Vercel Web MVP의 완성 및 실제 배포**다. 이 파일은 계획이며, 체크되지 않은 항목은 구현·검증 완료를 뜻하지 않는다. 이번 계획 작성에서는 애플리케이션을 구현하거나 배포하지 않았다.

제품 요구사항의 기준은 [PRD.md](PRD.md), 개발·보안 기준은 [AGENTS.md](AGENTS.md)다. [README.md](README.md), [결정 기록](docs/decisions.md), [공통 코어 방향](docs/ccc-rag-architecture.md), [Skill 계획](docs/skills-plan.md)을 함께 검토했다. 충돌 처리 원칙은 마지막 절에 정리한다.

## 1. Current State

### 확인한 자산과 미구현 부분

| 영역 | 실제 상태 | 필요한 작업 |
| --- | --- | --- |
| 루트 `package.json` | private npm workspace 선언(`apps/*`, `packages/*`)만 존재 | 실제 workspace manifest, 의존성, lockfile, 실행 스크립트 |
| `apps/web/` | README만 존재 | Next.js App Router, TypeScript, Tailwind, UI, Route Handler |
| `packages/spec-core/` | README만 존재 | 타입·코퍼스·MiniSearch·근거 검증·단위 테스트 |
| `apps/mcp/` | 미래 기능 README만 존재 | 그대로 유지; 실행 패키지나 서버 추가 없음 |
| `data/demo/spec-v1.json`, `spec-v2.json` | 독립 창작 합성 요구사항 각 16개, 총 32개 | 스키마·고유 ID·참조 검증과 빌드 시 정적 연결 |
| `evals/questions.json` | Q1–Q10 및 기대 Requirement ID 준비 | 실제 검색 평가 러너와 실패·인용 검증 케이스 추가 |
| `.env.example` | 서버 전용 키 예시와 `openrouter/free` 기본값 준비 | 서버 설정 로딩·무료 모델 제한·Vercel 설정 |
| `.gitignore` | `.env*`, `.next`, `.vercel`, `/data/local/` 등 제외 | 추적 파일·번들·로그에 대한 실제 검사 |
| `.agents/skills/` | Navigator/Auditor 정의·README·실제 예시 기록 존재 | 유지; Web 런타임과 연결하지 않음 |
| 테스트·배포 | 테스트 소스/러너/설정, CI, 앱 코드, 배포 URL 없음 | 테스트·lint·build 및 live 검증 |

정적 데이터 점검 결과: 실제 `documentId`는 두 버전 모두 `DKSI-SYNTHETIC`, `synthetic: true`다. 버전별 고유 Requirement ID는 16개이며 내부 references의 미해결 대상은 없었다. 같은 순번의 V1/V2 원문 16쌍 모두 다르다. 위임 공유(004), BLE 재시도(008), NFC 조건(010/011) 등 버전 차이와 조건·예외를 이미 포함한다. 평가 10개의 기대 ID는 모두 데이터에 존재한다. 이는 검색 품질이나 답변 정확성 검증 결과가 아니다.

현재 `dev`, `test`, `lint`, `build`는 설명을 출력하고 `exit 1` 하는 placeholder다. 실행 가능한 테스트는 없으며 이번 조사에서 이들을 통과했다고 주장하지 않는다. 로컬 환경에서 확인한 버전은 Node `v24.15.0`, npm `11.12.1`이다. 실제 채택 버전과 Vercel 지원 조합은 Phase 0에서 확인·고정한다.

Skill은 합성 V2에 대해 Navigator와 Auditor를 명시적으로 호출한 수동 예시가 각각 하나 기록되어 있다. 전체 활성화/비활성화·공격 입력 회귀 검증은 미완료다. 이 자산은 MiniSearch나 Web API가 구현되었다는 증거가 아니다.

## 2. Architecture

### 최소 데이터 흐름

```text
data/demo/*.json (빌드 시 정적 import, 원문 보존)
  -> SyntheticCorpusProvider -> MiniSearchRetriever
                                   ^
브라우저: 질문/버전/기본 topK=5       |
  -> POST /api/ask (Node.js, 입력 검증)
  -> 버전 필터 + 검색 -> Evidence[] (서버가 citationId/quote 생성)
     -> 근거 없음: insufficient_evidence, 모델 호출 없음
     -> 키 없음: search_only + sources
     -> OpenRouterProvider (서버에서 한 번, topK 이하 근거)
        -> 응답 스키마/인용/원문 검증
        -> answered 또는 llm_unavailable + sources + warnings
  -> UI: 상태/한국어 답변/근거 카드/전체 원문 확장
```

### 패키지 경계와 계약

- `apps/web` → `@dksi/spec-core` 단방향 의존. 공통 코어에 Next.js, React, OpenRouter SDK, 환경변수 접근, 브라우저 전역을 넣지 않는다.
- `packages/spec-core/src/types.ts`, `interfaces.ts`: Document/Requirement/Evidence와 최소 `CorpusProvider`, `Retriever`, `LLMProvider`, `EvidenceValidator` 인터페이스를 정의한다. ADR의 `listDocuments/getChunks/getSourceSpan`, `search`, `generateGroundedAnswer` 의도를 합성 요구사항 단위로 표현한다. PDF chunk 엔진·범용 플러그인 프레임워크는 만들지 않는다.
- `SyntheticCorpusProvider`는 정적 JSON을 주입받는다. `apps/web/src/server/corpus.ts`가 루트 `data/demo` 두 파일만 명시적으로 import하고 코어를 구성한다. 런타임 파일 읽기·쓰기나 `data/local` 탐색은 없다.
- `MiniSearchRetriever`는 heading/keywords/ID/section/text를 색인하고 `searchRequirements(query,{versions,topK})`, `getRequirement(citationId)`를 제공한다. 동점 정렬은 citationId로 고정한다. `getRelatedRequirements`는 필수가 아니며 참조 무결성 검사는 먼저 구현한다.
- 서버 모듈 singleton으로 읽기 전용 코퍼스/색인을 재사용하되, 질문·답변·사용자별 상태를 저장하지 않는다.
- `OpenRouterProvider` 구현은 `apps/web/src/server/llm/`에만 둔다. `LLMProvider` 타입은 코어에 두고 구현은 서버에서 주입한다. 응답 계약 타입은 UI에서 type-only import할 수 있게 분리한다.
- source ID는 `SRC:${documentId}:${version}:${requirementId}`. 예: `SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-010`. PRD 예시의 문서명·Section·ID를 실제 fixture 값으로 하드코딩하지 않는다.
- 초기 quote는 짧은 합성 Requirement의 **전체 text**를 사용해 조건 누락을 줄인다. fullText는 원문 그대로다. 검색 정규화는 별도 필드에만 적용하며 quote를 번역·정규화·재작성하지 않는다.

### API 동작 결정

입력은 PRD 계약 `{question, versions?, topK?}`를 유지한다. trim 이후 1–500자, `versions` 생략 시 전체, 제공 시 비어 있지 않은 V1/V2 배열, `topK` 생략 시 5 및 정수 1–8만 허용한다. 잘못된 타입·JSON·버전·범위는 HTTP 400, 과도한 본문은 413으로 처리하고 모델을 호출하지 않는다. API 오류의 JSON 형식은 앱 전용 계약으로 명시하고 정상 AskResponse와 구분한다.

정상 처리 응답은 PRD의 `{status,answer,sources,warnings}`를 유지한다.

| 상황 | status / answer | 모델 호출 |
| --- | --- | --- |
| 검색 근거 없음 | `insufficient_evidence` / null, sources=[] | 0회 |
| 근거 있고 키 미설정 | `search_only` / null, sources 유지 | 0회 |
| 검증된 모델 답변 | `answered` / 한국어 문자열, sources 유지 | 최대 1회 |
| 429, 오류, timeout, 비정상 출력, 인용 검증 실패 | `llm_unavailable` / null, sources 유지 및 경고 | 최대 1회, 자동 재시도 없음 |

모델 출력은 내부 JSON 스키마(답변 문자열, 인용 ID 및 정확한 quote 목록)로 파싱한다. 반환 answer 안의 `[SRC:...]`도 모두 추출하여 목록과 대조한다. 알 수 없는 ID, 검색되지 않은 ID, 다른 버전, 빈/변조 quote, 인용 없는 실질 답변, 파싱 실패는 답변 전체를 보류한다. 확인된 sources는 버리지 않는다. 인용 검증은 출처 일치 검사이며 논리적 함의의 증명이 아니다. 조건·예외·불확실성은 프롬프트와 수동 평가에서 별도로 점검한다.

## 3. Implementation Phases

P0는 시연의 필수 경로다. P1은 PRD의 개선 항목이며 최종 완료 전에 확인한다. 각 Phase 완료 시 **변경 파일 / 실행 명령과 실제 결과 / 한계 / 다음 단계**를 보고하고, 설계 변경은 `docs/decisions.md`에 기록한다. 아래 파일명은 구현 예정 경로이며 기존 파일을 뜻하지 않는다.

순서: **0 → 1 → 2 → 3 → 4 → 5**. Phase 1을 배포 가능한 검색 전용 Vertical Slice로 만든다. 이것은 중간 체크포인트이며 FR-07 AI 답변을 포함하는 최종 A–E 완료와 구분한다. Phase 2는 검색 품질, Phase 3은 AI 실패 격리, Phase 4는 사용자 흐름 완성, Phase 5는 최종 배포 증거를 독립 검증한다.

### Phase 0 — 실행 기반과 빌드 경로 (P0, 선행 없음)

- [ ] `package.json`: workspace 명령을 실제 `dev`, `test`, `lint`, `build`로 교체한다. 없는 MCP workspace로 실행을 전달하지 않는다.
- [ ] `apps/web/package.json`, `packages/spec-core/package.json`, `package-lock.json`: Next.js/React/TypeScript/Tailwind/MiniSearch/Vitest/ESLint 최소 의존성을 설치·고정한다. 구현 시 공식 문서에서 현재 호환 조합을 확인한다.
- [ ] 루트/패키지 `tsconfig.json`, `vitest.config.ts`, `apps/web/eslint.config.mjs`, `next.config.ts`, CSS 설정, `src/app/layout.tsx`, `page.tsx`, `globals.css`를 구성한다. lint는 실제 ESLint CLI를 실행하고 타입 검사는 build 또는 명시적 스크립트로 수행한다.
- [ ] Node/npm 버전을 `engines`와 버전 파일에 기록한다. Vercel의 지원 Node 버전과 맞추고 깨끗한 설치에 `npm ci`를 사용한다.
- [ ] TypeScript workspace 소스 소비/`transpilePackages` 및 루트 JSON import가 Next 빌드에서 작동하는지 확인한다. 필요할 때만 코어 사전 빌드 단계를 추가한다.
- [ ] `.env.example`, `.gitignore`를 검토하고 기존 synthetic/local 구분을 유지한다. 최소 코퍼스 스모크 테스트를 추가해 테스트 명령을 실제로 작동시킨다.

완료 조건: 깨끗한 의존성 설치 후 최소 페이지가 실행·빌드되고 test/lint가 실제 검사를 한다. 아직 검색·AI 완료로 표시하지 않는다. 대응: PRD §6/§8, FR-11 기반.

### Phase 1 — 검색 전용 Vertical Slice 및 조기 Preview (P0, Phase 0 필요)

- [ ] `packages/spec-core/src/types.ts`, `interfaces.ts`, `corpus.ts`: 최소 공유 계약과 SyntheticCorpusProvider를 구현한다.
- [ ] `corpus.test.ts`: 필수 필드, synthetic 표시, 버전 allowlist, 복합 ID 중복, 빈 text, 같은 버전 references를 검사한다. 원문 변경 없이 기존 32개를 사용한다.
- [ ] `retriever.ts`, `evidence.ts`, `index.ts`: MiniSearch 초기 색인, 버전 필터, topK, 복합 citationId 생성, 원문 Evidence 매핑과 `getRequirement`를 구현한다.
- [ ] `apps/web/src/server/corpus.ts`, `ask-service.ts`, `contracts.ts`, `src/app/api/ask/route.ts`: 입력 검증 → 검색 → `search_only`/`insufficient_evidence`를 연결한다. 이 단계에서는 키 유무와 관계없이 AI 미연결임을 표시한다.
- [ ] `src/components/ask-panel.tsx`, `evidence-card.tsx`: 질문/버전 선택, 기본 상위 5개, 카드의 문서명·버전·Section·Requirement ID·quote·전체 원문 확장을 구현한다.
- [ ] `src/app/page.tsx`: 고정 합성 경고와 실제 disabled/aria-disabled MCP 메뉴를 넣는다. MCP용 href/라우트/클릭 핸들러는 추가하지 않는다.
- [ ] 최소 검색/버전/원문/API 통합 테스트 후 Vercel Preview에 배포한다. 모노레포 Root Directory와 루트 데이터 번들링을 이때 검증한다.

완료 조건: 키 없이 브라우저 → API → 코어 → 5개 이하 근거 카드 흐름이 Preview에서 동작하고 원문을 펼칠 수 있다. 미지원 질문은 답변을 만들지 않는다. 대응: FR-01–06, FR-09–10(키 없음), FR-12–13, FR-11 중간 검증.

### Phase 2 — 검색 품질과 근거 검증 확정 (P0 + 명시된 P1, Phase 1 필요)

- [ ] `src/synonyms.ts`, `retriever.ts`: 영어 소문자/토큰 처리, 한영 용어 확장, field boost, prefix, 보수적인 fuzzy를 적용한다. ID 검색은 정확 매칭을 우선하고 숫자·짧은 토큰의 과도한 fuzzy를 막는다.
- [ ] **P1 FR-14**: 등록↔provisioning/enrollment, 공유↔sharing, 재공유↔delegation/reshare, 폐기↔revocation, 권한↔entitlement, 재시도↔retry, 태그↔tap 등 최소 5쌍을 검사한다. 한국어 조사/복합 질문에 대한 정적 매핑을 확인한다.
- [ ] `evidence-validator.ts`, 대응 테스트: source registry와 retrieved allowlist를 함께 확인하고 quote가 원본 text의 비어 있지 않은 연속 부분문자열인지 검사한다. 위조 ID, 다른 버전, 유효하지만 미검색된 ID, 잘린 조건의 의미 위험을 구분한다.
- [ ] `evals/run.ts`, `evals/questions.json`, `retriever.test.ts`: 기존 Q1–Q10을 자동 실행하고 질문별 실제 top-5 ID와 기대 ID 포함 여부를 출력한다. `npm run eval`을 루트에 추가한다.
- [ ] Q1–Q7/Q9/Q10의 모든 기대 ID가 top 5에 들어오는지 확인한다. Q4는 010/011, Q5는 V1/V2의 008이 함께 있어야 한다. Q8은 sources=[] 및 모델 호출 0회로 검증한다.
- [ ] 무관한 질문이 일반 단어 때문에 적중할 수 있으므로 점수/용어 적중 조건을 명시적으로 조정한다. MiniSearch score를 확률로 표시하지 않는다. 별도의 표현 변형·무관 질문을 추가하고 특정 질문 ID별 하드코딩은 하지 않는다.

완료 조건: 전체 기대 ID의 top-5 포함, 버전 누출 0건, 출처/quote 검증 통과, 알려진 음성 질문의 무근거 처리. 결과와 한계를 기록하고 데이터 원문을 순위 개선 목적으로 바꾸지 않는다. 대응: FR-03–05, FR-08–09, FR-14, PRD §8.

### Phase 3 — 서버 전용 AI 답변 및 실패 격리 (P0, Phase 2 필요)

- [ ] `apps/web/src/server/llm/openrouter.ts`, `prompt.ts`, `response-schema.ts`: `server-only` 경계에서 `LLMProvider`를 구현한다. 질문·검색된 근거만 전달하고 검색 text를 지시로 취급하지 않는 한국어 근거 프롬프트를 작성한다.
- [ ] `ask-service.ts`: 검색 이후만 호출하며 최대 topK 근거를 전달한다. 기본 모델은 `openrouter/free`, 명시된 무료 모델만 설정 가능하도록 무료 모델 검증 정책을 두고 유료 자동 전환을 금지한다.
- [ ] 한 요청당 모델 호출 최대 1회, 예: 10초 AbortController timeout, 출력 토큰 상한, 모델 응답 크기 상한을 설정한다. 플랫폼 함수 제한보다 짧게 조정하고 설정값은 결정 기록에 남긴다.
- [ ] 모델 내부 JSON 출력과 answer 내 모든 인용을 검증한다. unsupported/불확실한 판단은 보수적으로 표현하도록 지시하고 잘못된 인용은 전체 답변을 보류한다.
- [ ] 키 없음은 `search_only`; API 429/5xx, 네트워크/timeout, malformed 응답, 잘못된 인용은 `llm_unavailable`로 매핑한다. answer=null과 동일 검색 sources를 유지한다.
- [ ] `ask-service.test.ts`, `openrouter.test.ts`, `route.test.ts`: 주입 가능한 fake provider/fetch로 정상 응답과 모든 실패 경로, 요청 횟수·증거 개수·비밀 비노출을 검사한다. CI 테스트는 실제 API를 호출하지 않는다.
- [ ] 본문 제한(예: 8 KiB), 질문/버전/topK 검증, `Cache-Control: no-store`, raw prompt/키/상류 오류 응답 로그 금지를 적용한다. 같은 출처 요청 정책을 확인하고 불필요한 CORS 허용을 추가하지 않는다.

완료 조건: 실제 무료 모델로 한국어 근거 답변을 적어도 한 번 확인하고, provider를 끊거나 실패시켜도 검색을 사용할 수 있다. 무료 모델이 계속 불가하면 fallback 배포는 유지하되 FR-07 실연 미확인으로 보고하며 A–E 전체 완료로 표시하지 않는다. 대응: FR-07–10, PRD §7/§9.

### Phase 4 — 시연 UX·접근성 및 통합 회귀 (P0 + P1, Phase 3 필요)

- [ ] `ask-panel.tsx`, `answer-panel.tsx`, `evidence-card.tsx`: answered/검색 전용/모델 불가/근거 없음/입력 오류를 구분하고 warnings를 표시한다. 원문은 안전한 React text로 렌더링하며 raw HTML을 허용하지 않는다.
- [ ] **P1 FR-15**: 위임 공유 V1/V2 차이, V2 UWB→NFC 조건, V2 entry-only 시동 권한의 세 예시 질문을 제공하고 예상 버전 선택을 명확히 한다.
- [ ] **P1 FR-16/17**: 모바일 폭(375px)·데스크톱(1280px), form label, keyboard, focus, aria-live 상태, 대비, 긴 ID/원문 줄바꿈을 확인한다. 전송 중 중복 submit을 막고 오류 후 재시도가 가능하게 한다.
- [ ] 응답 순서가 뒤바뀌어 이전 질문/버전 결과가 최신 화면에 붙지 않도록 pending 상태 또는 요청 취소를 처리한다.
- [ ] `apps/web/e2e/ask.spec.ts`, Playwright 설정 및 `test:e2e`: 실제 로컬 서버에서 정상 검색, 버전 필터, 원문 확장, 키 없는 fallback, 무근거, disabled MCP의 마우스/키보드 비탐색을 검사한다. 모델 성공 화면은 결정적 stub으로 별도 확인한다.
- [ ] 수동으로 조건/예외/SHALL·MAY 구분과 인용의 논리적 지지 여부를 검토한다. 버전 비교는 검색 결과를 나란히 해석하는 수준이며 별도 diff 엔진으로 표현하지 않는다.

완료 조건: FR-12 메뉴가 흐리게 보이기만 하는 것이 아니라 실제 비활성이고, 작은 화면에서 답변·카드를 읽을 수 있다. 세 예시·loading·429 안내·fallback까지 시연한다. 대응: FR-02/04–06/08–10/12–13/15–17.

### Phase 5 — 최종 배포·실측·발표 준비 (P0, Phase 4 필요)

- [ ] 깨끗한 설치 기준 `npm ci`, `npm run test`, `npm run eval`, `npm run lint`, `npm run build`, `npm run test:e2e`를 실행하고 결과를 기록한다. 실패한 필수 항목은 수정 후 해당 경로를 재검증한다.
- [ ] Vercel production 설정/환경변수/빌드 결과를 검토하고 최종 배포한다. 실제 URL을 열어 배포 후 검증표를 수행한다.
- [ ] `README.md`, `apps/web/README.md`, `packages/spec-core/README.md`, `docs/decisions.md`: 구현 상태·설치법·실제 URL·fallback 한계·확인한 명령 결과를 갱신한다. placeholder 문구를 사실에 맞게 수정한다.
- [ ] 필요하면 `.github/workflows/ci.yml`에 비밀 없는 install/test/eval/lint/build를 구성한다(P1). CI 추가 자체를 배포 선행조건으로 삼지는 않는다.
- [ ] 발표 순서를 합성 경고 → 질문/버전 → 근거/원문 → AI 답변 → 무근거 → 키 없음/모델 장애 fallback → disabled MCP로 기록한다.

완료 조건: A–E 기능·필수 테스트·actual live URL 확인 증거가 모두 있고, 미실행/실패 항목은 별도로 공개한다. 대응: FR-11 및 PRD §8 전체 DoD.

## 4. Acceptance Criteria / Traceability

| 요구사항 | 구현 Phase / 주요 파일 | 완료 증거 |
| --- | --- | --- |
| FR-01 | 1 / corpus + 기존 JSON | 각 16개, synthetic, >=2 변화·조건/예외, 고유 ID·참조 검사 |
| FR-02 | 1/3/4 / route, ask-panel | 한/영, blank·501자·잘못된 타입 거부; 500자 수용 |
| FR-03 | 1/2 / retriever, evals/run | 기본 5개, 모든 기대 ID top-5, 결정적 ID/정렬 |
| FR-04 | 1/2/4 / retriever, UI | V1/V2/all; 검색·답변·원문에서 타 버전 누출 0 |
| FR-05 | 1/2 / evidence, evidence-card | 문서명·버전·Section·Requirement ID·정확 quote |
| FR-06 | 1/4 / evidence-card | 전체 원문 펼침/접기 및 fixture와 일치 |
| FR-07 | 3 / server/llm | server-only 무료 모델 한국어 답변 실제 확인 |
| FR-08 | 2/3/4 / validator, response parser | 위조/미검색/교차 버전 ID 및 quote 변조 거부, 의미 검증 한계 안내 |
| FR-09 | 1/2/3 / ask-service | Q8 및 추가 무관 질문: insufficient_evidence, answer=null, 호출 0 |
| FR-10 | 1/3/4 / provider, status UI | 키 없음/429/error/timeout/malformed에도 동일 sources 사용 |
| FR-11 | 1 Preview, 5 최종 | 실제 Vercel URL과 수동 확인 기록 |
| FR-12 | 1/4 / page, e2e | dim + disabled + aria-disabled, href/라우트/탐색 없음 |
| FR-13 | 1/4/5 / layout/page | 지정 합성 경고 상시 노출, 내부 자료 요청 없음 |
| FR-14 (P1) | 2 / synonyms | 한영 >=5쌍 및 표현 변형 검색 |
| FR-15 (P1) | 4 / ask-panel | 질문 action 3개 동작 |
| FR-16 (P1) | 4 / components, CSS | 375px/1280px 및 keyboard 수동 확인 |
| FR-17 (P1) | 3/4 / service/UI | loading/429/fallback 구분, 중복 전송 방지 |

## 5. Testing Strategy

- **단위(Vitest)**: 코퍼스 구조·복합 ID·참조·원문 보존, query 정규화/동의어, 버전 제외, topK 경계 1/8과 잘못된 값, 안정적 순위, quote substring, 존재하지만 미검색인 ID와 위조 ID를 검사한다.
- **RAG 품질**: Q1–Q10의 원래 기대값을 유지한다. 양성 9개는 각 케이스의 모든 기대 ID가 top 5에 포함되어야 한다. 음성 Q8과 추가 무관 질문은 빈 근거여야 한다. 질문별 결과/실패 사유와 기대 ID 회수율을 출력한다. 이 작은 fixture 결과를 일반적인 검색 정확도로 홍보하지 않는다.
- **계약/통합(Vitest)**: Route Handler → 실제 코어 → fake LLM. 400/413, 응답 status, 무근거 무호출, 키 없음, 정상/429/5xx/timeout/네트워크/malformed/위조 인용, 호출 1회 상한, sources 보존을 검증한다.
- **브라우저(Playwright + 수동)**: 실제 API 검색 경로, 버전 변경, 원문 expansion, 오류 복구, 중복 전송 방지, inert MCP, 모바일 레이아웃을 확인한다. 실제 외부 모델은 자동 회귀의 필수 의존성에서 제외한다.
- **근거의 의미 수동 검토**: 위임 권한 subset/추가 위임 금지, NFC 권한 및 suspended 거부, entry-only와 시동 구분을 체크한다. 정확한 quote만 있는 오해의 소지가 있는 답변도 실패로 기록한다. 완전한 자동 entailment 판정은 목표가 아니다.
- **빌드/안전**: 루트 scripts가 실제 실패를 전달하는지 확인하고, Vercel에서 workspace·JSON 번들 포함과 Node runtime을 검사한다. tracked 파일과 Git 이력에 secret/private 파일 흔적이 있는지 값 비노출 방식으로 확인한다. 실자료 폴더를 열거나 원문을 수집하지 않는다.
- **Skill 별도 검증**: `.agents/skills/`는 수정·실행 의존성에 넣지 않는다. 전체 Skill activation/negative/adversarial 시험은 별도 수동 Codex 세션 기록으로만 인정하며 Web 테스트 통과로 대체하지 않는다. Web 배포의 선행조건으로 추가하지 않는다.

## 6. Deployment Plan

1. Phase 0에서 Next/Vercel/npm workspace 공식 문서로 지원 설정을 확인한다. 저장소를 Vercel 프로젝트에 연결하고 Framework=Next.js, Root Directory=`apps/web`으로 설정한다. 루트의 workspace/`data/demo` 파일을 빌드에 포함할 수 있는 상위 경로 접근 설정을 확인한다.
2. 루트 lockfile 기준 설치가 이루어지게 설정한다. 기본 auto-detection을 먼저 확인하고, 필요하면 저장소 루트에서 설치하도록 명시한다. Build는 web workspace를 대상으로 하며 core 빌드가 필요하면 선행한다. Output Directory는 Next.js 기본값을 사용한다.
3. Phase 1 Preview는 키 없이 배포해 검색과 정적 데이터 번들링을 검증한다. `apps/mcp`, `.agents/skills`, 로컬 자료가 런타임 코드로 연결되지 않아야 한다.
4. Preview/Production의 서버 환경변수를 각각 설정한다. `OPENROUTER_API_KEY`는 선택적 secret, `OPENROUTER_MODEL=openrouter/free`가 기본이다. 키를 Git/클라이언트 props/응답/로그에 넣지 않는다. 설정 변경 후 재배포한다. 공개 `NEXT_PUBLIC_*` secret은 없다.
5. 기본 무료 라우터와 무료 모델 allowlist 외 유료 호출을 거부한다. 제공자 정책이나 privacy 옵션이 무료 라우팅과 충돌하면 실패를 fallback으로 처리한다. 실자료 전송 옵션·source/provider selector는 공개 MVP에 만들지 않는다.
6. production 배포 후 아래를 실제 URL에서 검사하고 URL·배포 시각·커밋·검사 결과를 README 또는 결정 기록에 남긴다.

- [ ] 합성 경고와 disabled MCP, 모바일/데스크톱 화면 확인.
- [ ] Q1(V1), Q3(V2), Q5(all)의 top-5와 원문 확장 확인.
- [ ] Q8 무근거와 invalid POST 검증; 모델 호출 없음 확인.
- [ ] 실제 AI 응답과 인용·조건을 수동 대조. 일시적 제공자 장애는 실제 발생 상태로 기록.
- [ ] 키 없는 Preview에서 검색 전용 확인; timeout/429는 자동 통합 테스트 또는 별도 통제된 환경에서 재현. 실제 장애가 없었다면 live 재현 완료라고 쓰지 않는다.
- [ ] 브라우저 네트워크/클라이언트 산출물에서 키·서버 설정 비노출, 콘솔 오류와 API 응답 확인.
- [ ] Vercel 배포 로그·함수에 루트 JSON 누락이나 런타임 쓰기 의존성이 없는지 확인.

Vercel 계정 접근/프로젝트 연결/secret 설정 권한이 없다면 필요한 외부 조치만 요청한다. 공개 MVP는 개인 비상업적 학술 시연용이며 회사 운영으로 전환하지 않는다.

## 7. Risks & Mitigations

| 위험 | 대응 및 검증 |
| --- | --- |
| 무료 모델 가용성·쿼터·429 | 키 없는 검색을 먼저 배포; 1회/10초 상한, 출력 제한, 자동 재시도·유료 전환 없음; 성공 확인과 실패 검증을 구분 |
| 공개 endpoint의 반복 호출·비용/쿼터 소진 | 500자/본문/topK/출력 제한, UI 중복 방지, 배포 플랫폼에서 사용 가능한 요청 제한 확인; 저장소/DB 없이 적용. 인스턴스 메모리 제한만으로 전역 rate limit을 보장한다고 주장하지 않으며 필요 시 AI 키를 제거해 검색 전용 유지 |
| 한국어 lexical recall 부족 | >=5 동의어와 보수적 token/prefix/fuzzy, 기존 10개와 표현 변형 eval; embedding으로 오표기하지 않음 |
| 일반 용어 적중이 무관한 근거로 연결 | 음성 질문과 최소 적중 조건 점검; 애매하면 보류/한계 표시. 검색 점수를 의미적 확신으로 사용하지 않음 |
| 유효 인용을 단 오해·조건 누락 | 전체 Requirement quote, 조건·예외 보존 프롬프트, 위조 인용 보류, 수동 논리 검토; expert-reviewed 보장 금지 |
| prompt injection/XSS | 출처는 데이터로만 취급, tool 실행 없음, 모델/질문 raw HTML 렌더링 없음, 응답 스키마와 인용 allowlist |
| 비밀·실제 CCC 자료 유출 | 서버 전용 키, 합성 파일 명시적 import, `/data/local/` ignore, 로그 최소화, tracked 파일/이력/번들 검토 |
| 모노레포 root 밖 JSON 누락 | Phase 1 조기 Preview; 깨끗한 설치·build·실제 API로 번들 검증. 런타임 파일 복사로 우회하지 않음 |
| 시연 당일 범위 과잉 | 검색 전용 Vertical Slice 선행, AI 추가, UX 마무리 순서. MCP/PDF/DB/인증/복잡한 비교 엔진 제외; P0 누락을 완료로 숨기지 않음 |

## 8. Out of Scope / Future Work

이번 A–E에서는 다음을 구현하지 않는다.

- Local stdio MCP(F), 실제 MCP tool/server/endpoint/page 및 가짜 MCP 시연.
- 실제 CCC V3.1.4/V4.1.0 파일 확보·열람·파싱·색인, 사용자 업로드, `data/local` 처리, 로컬 Web 모드, Ollama·외부 실자료 전송 게이트.
- vector/embedding/hybrid retrieval, reranker, 전용 버전 diff/영향 분석 엔진, cross-spec 관계 그래프.
- 로그인·DB·사용자 질문/답변 영속화·회사 통합·ACL·공유 지식 저장소·분석 추적.
- Skill 파일을 웹앱이 실행하는 기능, 신규 Skill 확장, Skill을 RAG/MCP 구현으로 포장하는 동작.

공유 네 가지 인터페이스와 무결한 원문·버전·인용 계약만 미래 확장 지점으로 남긴다. 후속 로컬 실증은 문서 이용 권한·조직 정책을 확인한 별도 계획으로 수행한다.

## 9. 문서 충돌·모호함 및 확인 사항

| 항목 | 이번 계획의 처리 / 확인 시점 |
| --- | --- |
| PRD §3은 후속 Ollama 답변을 언급하지만 최신 AGENTS/decisions는 회사 승인 에이전트+MCP, Ollama 선택이라고 명시 | A–E에는 영향 없음. 후속 방향은 최신 결정 기록을 참고하되 PRD 문구 정합성은 차후 정리할 항목으로 남김. 이번에는 어느 것도 구현하지 않음 |
| ADR은 source/inference selector, PDF/외부 처리 옵션, privacy 설정을 상세히 설명 | 미래 설계로 해석. 공개 MVP는 synthetic+OpenRouter만 제공하고 selector/추가 provider UI를 만들지 않음. provider privacy 옵션은 구현 시 호환성 확인 |
| ADR의 MCP가 본문 핵심 경로인 동시에 말미 P2로 표현됨 | 후속 우선순위는 별도 확정; 이번 F 제외에는 모호함 없음 |
| PRD 예시 `DKSI-DEMO`와 fixture의 `DKSI-SYNTHETIC`이 다름 | 예시는 계약 설명으로 해석하고 데이터가 실제 ID의 기준. 기존 fixture/Skill 예시를 변경하지 않음 |
| PRD의 Top 5와 API의 topK 1–8 | UI 기본 5, API는 1–8 허용; top-5 평가는 기본 설정 기준 |
| eval에 citation rejection/model-unavailable 사례가 없음 | 기존 10개 유지, 별도 validator/API fixture로 추가. 기존 파일만으로 전체 DoD 충족이라고 하지 않음 |
| 빈 versions, 잘못된 JSON, 실패 status 구분, invalid 인용 처리 세부가 미정 | 본 계획의 400/413 및 보수적 답변 전체 보류 정책을 기본으로 구현하고 `docs/decisions.md`에 기록 |
| 경과된 Skill 문서의 미검증 표현과 최신 예시 기록 | 최신 기록은 명시적 수동 1회씩만 인정. 전체 회귀 검증 완료로 확대 해석하지 않음 |
| 배포 계정/프로젝트/도메인, Vercel Node 및 실제 무료 모델 지원 | Phase 0/1에 확인; 커스텀 도메인은 필수가 아니며 생성된 live URL로 충분 |

이 항목들은 계획 검토 결과이며 이번 작업에서 기존 요구사항 문서를 수정하지 않는다. 실제 구현 때 새로운 결정·범위 이탈은 `docs/decisions.md`에 기록한다. 설치 버전과 계정 설정 외에는 현 정보로 Phase 0을 시작할 수 있으며, AI 제공자 장애는 검색·근거 배포를 막지 않게 한다.
