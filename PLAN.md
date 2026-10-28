# Web MVP A–E 실행 계획 — Multi-Agent Edition

작성일: 2026-10-29. 목표는 같은 날 수업에서 시연할 수 있는 **합성 데이터 기반 Vercel Web MVP의 완성 및 실제 배포**다. 이 파일은 계획이며, 체크되지 않은 항목은 구현·검증 완료를 뜻하지 않는다. 계획 수립 후 구현을 시작했다. 체크 상태와 하단 Implementation log가 실제 진행 결과의 기준이며, 배포·실모델 검증 미완료 항목은 별도로 표시한다.

제품 요구사항의 기준은 [PRD.md](PRD.md), 개발·보안 기준은 [AGENTS.md](AGENTS.md)다. [README.md](README.md), [결정 기록](docs/decisions.md), [공통 코어 방향](docs/ccc-rag-architecture.md), [Skill 계획](docs/skills-plan.md)을 함께 검토했다. 충돌 처리 원칙은 마지막 절에 정리한다. 이번 개정은 기존 계획의 범위를 유지하면서 Main + 최대 3개 Subagent 실행으로 재배치한 것이다. 계획 확정 후 사용자 승인으로 구현을 시작했으며, 아래 체크리스트와 로그에 진행 상황을 반영한다. 이번 개정에는 의존성·파일 소유권·테스트 전략을 각각 담당한 3개 read-only subagent의 병렬 검토 결과를 반영했다.

## 1. Current State

### 현재 실행 결과

로컬 Core/API/UI 구현과 독립 리뷰를 마쳤다. 단위·통합163개, 검색 평가18개, 브라우저7개, lint/typecheck/build를 실제 실행해 통과했다. dev는 http://localhost:3000 에서 계속 실행 중이다. 전체 제품명과 manifest 기반 Web v0.1.0 표시도 추가했다. Vercel 로그인·OpenRouter 키가 없어 M2/M4(실모델)/M6(live)와 전체 A–E 완료 판정은 남아 있다.

### 착수 시점의 자산과 부족한 부분 (기준 기록)

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
| 디자인 | `DESIGN.md`의 A안 Clear Desk·Pretendard 확정, `design-preview.html` 비교 시안 준비 | 실제 React UI로 구현; 메뉴 형태는 필요 시 별도 선택 |
| 테스트·배포 | 테스트 소스/러너/설정, CI, 앱 코드, 배포 URL 없음 | 테스트·lint·build 및 live 검증 |

정적 데이터 점검 결과: 실제 `documentId`는 두 버전 모두 `DKSI-SYNTHETIC`, `synthetic: true`다. 버전별 고유 Requirement ID는 16개이며 내부 references의 미해결 대상은 없었다. 같은 순번의 V1/V2 원문 16쌍 모두 다르다. 위임 공유(004), BLE 재시도(008), NFC 조건(010/011) 등 버전 차이와 조건·예외를 이미 포함한다. 평가 10개의 기대 ID는 모두 데이터에 존재한다. 이는 검색 품질이나 답변 정확성 검증 결과가 아니다.

현재 `dev`, `test`, `lint`, `build`는 설명을 출력하고 `exit 1` 하는 placeholder다. 실행 가능한 테스트는 없으며 이번 조사에서 이들을 통과했다고 주장하지 않는다. 로컬 환경에서 확인한 버전은 Node `v24.15.0`, npm `11.12.1`이다. 실제 채택 버전과 Vercel 지원 조합은 Phase 0에서 확인·고정한다.

Skill은 합성 V2에 대해 Navigator와 Auditor를 명시적으로 호출한 수동 예시가 각각 하나 기록되어 있다. 전체 활성화/비활성화·공격 입력 회귀 검증은 미완료다. 이 자산은 MiniSearch나 Web API가 구현되었다는 증거가 아니다.

## 2. Architecture & API Contracts

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

정상 처리 응답은 PRD의 `{status,answer,sources,warnings}`를 유지한다. B1에서 다음 wire shape를 하나의 타입 정의로 고정한다.

```ts
type AskRequest = { question: string; versions?: ("V1" | "V2")[]; topK?: number };
type Evidence = {
  citationId: string; documentId: string; documentTitle: string;
  version: "V1" | "V2"; sectionId: string; requirementId: string;
  quote: string; fullText: string; score?: number;
};
type AskResponse = {
  status: "answered" | "insufficient_evidence" | "search_only" | "llm_unavailable";
  answer: string | null; sources: Evidence[]; warnings: string[];
};
type ApiError = { error: { code: "invalid_request" | "payload_too_large" | "internal_error"; message: string } };
```

문자 수는 trim 이후 Unicode code point 기준으로 계산하고 클라이언트 counter와 서버 검증을 맞춘다. valid request의 모델 실패는 HTTP 200 AskResponse로 반환하며, 잘못된 입력만 400/413 ApiError다. 복구 불가능한 앱 내부 오류는 500 ApiError로 처리해 유효 source가 있는 정상 fallback과 구분한다.

| 상황 | status / answer | 모델 호출 |
| --- | --- | --- |
| 검색 근거 없음 | `insufficient_evidence` / null, sources=[] | 0회 |
| 근거 있고 키 미설정 | `search_only` / null, sources 유지 | 0회 |
| 검증된 모델 답변 | `answered` / 한국어 문자열, sources 유지 | 최대 1회 |
| 429, 오류, timeout, 비정상 출력, 인용 검증 실패 | `llm_unavailable` / null, sources 유지 및 경고 | 최대 1회, 자동 재시도 없음 |

모델 출력은 내부 JSON 스키마(답변 문자열, 인용 ID 및 정확한 quote 목록)로 파싱한다. 반환 answer 안의 `[SRC:...]`도 모두 추출하여 목록과 대조한다. 알 수 없는 ID, 검색되지 않은 ID, 다른 버전, 빈/변조 quote, 인용 없는 실질 답변, 파싱 실패는 답변 전체를 보류한다. 확인된 sources는 버리지 않는다. 인용 검증은 출처 일치 검사이며 논리적 함의의 증명이 아니다. 조건·예외·불확실성은 프롬프트와 수동 평가에서 별도로 점검한다.

## 3. Implementation Phases / Task Breakdown

**실행 원칙:** Main 1명 + Subagent 최대 3명(Core / Frontend / API), 총 4개 실행 슬롯. Phase는 기능별 구분이며 시간상 전체를 직렬 실행하지 않는다. 모든 TODO에 ID·우선순위·담당·선행 조건을 붙인다. 아래 파일은 구현 예정 경로다. 준비 작업과 Gate는 Main이 순차 처리하고, 서로 다른 소유 파일의 구현만 병렬화한다.

**우선순위:** P0와 보안·출처 무결성·실제 배포 검증을 먼저 끝낸다. FR-14~17 및 추가 CI는 P1로서 시간이 부족하면 축소/보류하고 미충족 FR을 기록한다. 다만 P0 평가 질문에 필요한 최소 한영 처리, 안전한 렌더링, 기본 label/모바일 읽기, 최소 loading/중복 전송 방지는 정확성·안전의 기반이므로 유지한다. P1 전체 완료를 P0 배포의 선행조건으로 두지 않는다.

### Phase 0 — Main의 실행 기반·공통 계약 확정 (순차, P0)

- [x] **B0 · Main · 선행 없음:** README/PRD/AGENTS/DESIGN과 권한을 재확인하고 Node/npm·Next/React/TS/Tailwind/MiniSearch/Vitest의 호환 버전 및 Vercel 지원을 공식 문서로 확인한다. `package.json`, workspace manifests, lockfile, engines/버전 파일, tsconfig/ESLint/Vitest/Next/CSS 설정과 실제 dev/test/lint/build/eval 스크립트를 구성한다. 설치·의존성 변경은 Main만 수행한다.
- [x] **B1 · Main · B0 후:** `packages/spec-core/src/{types,interfaces,index}.ts`, `apps/web/src/contracts/ask.ts`에 Document/Requirement/Evidence, 네 provider 인터페이스, AskRequest/AskResponse/ApiError, 모델 내부 출력과 validator 반환 타입을 정의한다. §6의 계약 목록을 확정하고 각 agent에게 동일한 파일·export 목록을 전달한다. §2의 400/413·버전·topK·status 정책을 테스트 fixture로 고정한다.
- [x] **B2 · Main · B1 후:** 최소 Next shell과 실제 corpus import 스모크 테스트, 공유 응답 fixture를 추가한다. `src/server/ask-runtime.ts`에 B1의 `getAskService()` 타입·export 경계를 먼저 만든다. M1 전에는 미구성 오류를 명시적으로 발생시키며 가짜 성공/검색 결과를 반환하지 않는다. R2 테스트는 존재하는 이 모듈을 mock하고, M1에서 실제 조립으로 교체한 뒤 배포한다. `npm ci`, `npm run test`, `npm run lint`, `npm run build`로 G0를 검사한다. eval 스크립트는 실제 러너가 추가되기 전 사용 불가임을 표시하며 빈 성공으로 처리하지 않는다. Vercel 프로젝트/권한/Root Directory를 확인해 외부 계정 문제를 조기 발견한다. Pretendard 공식 WOFF2·라이선스 확보 방식도 이때 확정한다.

**G0 완료:** 설치·shell 빌드·실제 테스트가 동작하고, 계약/파일 소유권이 고정되어 PG1을 시작할 수 있다. 검색·AI 구현 완료를 뜻하지 않는다.

### Phase 1 — 검색 전용 Vertical Slice (PG1 병렬 → Main 통합, P0)

- [x] **C1 · Core · G0 후:** `src/corpus.ts`, `corpus.test.ts`에 JSON 주입형 SyntheticCorpusProvider를 구현한다. 기존 32개 원문의 필수 필드·synthetic·복합 ID·참조·버전을 검증한다. 원본 JSON은 수정하지 않는다.
- [x] **C2 · Core · C1 후:** `src/{retriever,evidence}.ts`와 테스트에 MiniSearch 색인·필드 boost·버전 선필터·기본 top5/상한8·복합 ID·원문 Evidence·getRequirement를 구현한다. 최소 알려진 질문과 Q8을 점검하고 Main에 함수 exports를 전달한다.
- [x] **U1 · Frontend · G0 후:** `src/app/{layout,page}.tsx`, `globals.css`, `src/components/{app-header,ask-panel,evidence-card}.tsx`를 A안·Pretendard로 구현한다. 질문/버전/합성 경고/원문 펼침/inert MCP를 만든다. 실제 메뉴 형태는 추가하지 않는다. Main 소유 fixture를 읽어 개발할 수 있으나 실제 실행 경로에 고정 결과를 남기지 않는다.
- [x] **U2 · Frontend · U1 후:** `src/client/ask-client.ts`, ask-panel을 실제 `/api/ask` 요청으로 연결하고 기본 오류/검색 전용/무근거 상태를 구현한다. 응답 타입은 Main 소유 계약을 type-only import한다. route 완성 전에는 로컬 테스트에서만 fetch fake를 주입한다.
- [x] **R1 · API · G0 후:** `src/server/{ask-service,request-validation}.ts`와 단위 테스트에 입력 검증·주입형 Retriever·무근거 무호출·검색 전용 응답을 구현한다. Core 구현 완료를 기다리지 않고 계약을 만족하는 fake retriever로 검사한다.
- [x] **R2 · API · R1 후:** `src/app/api/ask/route.ts`, `route.test.ts`에 Node runtime·본문 제한·400/413·no-store·서버 오류 비노출을 구현한다. Main의 `src/server/ask-runtime.ts` 조립 함수를 호출하도록 어댑터를 만든다. 이 조립 파일의 타입·export 경계는 B2에 존재하고 실물 조립은 Main이 M1에서 완성한다. 개별 검증은 주입형 service/route mock으로 하고 전체 빌드는 M1에서 수행한다.
- [x] **M1 · Main · C2+U2+R2 후:** 모든 writer를 잠시 멈추고 `spec-core/src/index.ts` exports, `web/src/server/corpus.ts`, `ask-runtime.ts`를 연결하고 `web/src/integration/**`에 실물 연결 테스트를 둔다. 정적 demo import → 실제 코어 → 실제 API → 실제 UI로 동작시키고 고정 응답·fake provider가 production 경로에 없는지 확인한다. 검색/버전/원문/API 통합 테스트·lint·build를 실행해 G1-local을 통과한다.
- [ ] **M2 · Main · M1 후:** 키 없는 Vercel Preview를 배포하고 실제 검색·버전·근거 카드·모바일 화면·정적 JSON 번들링을 확인한다(G1-preview). 이 작업 중 PG2는 G1-local 기준으로 시작할 수 있다. 배포 대상 커밋을 먼저 고정하고, 해당 커밋의 Git 연동 배포 또는 별도 임시 checkout에서 배포한다. PG2가 편집 중인 공유 worktree를 CLI로 직접 업로드하지 않는다.

**G1 완료:** 키 없이 브라우저 → 실제 API → 실제 검색 → 근거/원문이 동작한다. G1-preview까지 확인된 URL을 중간 배포 성과로 기록한다. AI 답변 없는 Vertical Slice를 최종 A–E 완료로 표시하지 않는다.

### Phase 2 — 검색 품질·근거 무결성 (PG2-Core, P0 중심)

- [x] **C3 · Core · G1-local 후:** `retriever.ts`, `synonyms.ts`와 테스트에서 한영 정규화·prefix·보수적 fuzzy·동점 정렬·음성 질문 판정을 개선한다. 모든 양성 Q1–Q7/Q9/Q10의 기대 ID가 top5에 들어가게 하고 Q8은 빈 근거로 유지한다. ID별 정답 하드코딩·원문 수정은 금지한다. **P1 FR-14:** 여유 시 최소 5쌍 이상 동의어를 확장 검증한다.
- [x] **C4 · Core · G1-local 후, C3와 같은 agent가 순차 수행:** `evidence-validator.ts`와 테스트에 source registry+retrieved allowlist, 문서/버전/ID·비어 있지 않은 정확 quote 검증을 구현한다. 위조·미검색·교차 버전·quote 변조를 거부한다. 단순 일치를 의미적 증명으로 표현하지 않는다. API agent는 확정 인터페이스의 fake validator로 먼저 작업한다.
- [x] **C5 · Core · C3+C4 후:** `evals/run.ts`, `evals/additional-cases.json`에 기존 10개 평가와 표현 변형·음성 케이스 러너를 추가한다. `evals/questions.json`의 원래 기대값은 유지한다. `npm run eval`의 실제 top5·기대 ID 포함·버전 누출·실패 exit code를 확인하고 결과를 Main에 전달한다.

**독립 완료 조건:** 코어 단위/평가 통과, 버전 누출 0, 원문·ID 일치. C3/C4는 API·UI의 작업 시작을 막지 않지만 검증기 실물 연결은 G2의 필수 조건이다.

### Phase 3 — AI 답변·실패 격리 (PG2-API, P0)

- [x] **R3 · API · G1-local 후:** `src/server/llm/{openrouter,prompt,response-schema}.ts`에 server-only LLMProvider를 구현한다. 무료 모델 allowlist와 기본 `openrouter/free`, 한국어 근거 프롬프트, topK 이하 context, 한 번 호출, 10초 내외 timeout·출력/응답 크기 상한·자동 재시도 없음 정책을 적용한다. 실제 키 없이 fake fetch로 검증한다.
- [x] **R4 · API · R3 후:** `ask-service.ts`에 모델 JSON/answer 인용 대조와 EvidenceValidator 주입을 연결한다. 정상만 answered; 키 없음 search_only; 429/5xx/network/timeout/malformed/잘못된 인용은 answer=null의 llm_unavailable+동일 sources+warnings. C4가 끝나지 않았으면 명시적 fake로 검사하고 실물 연결 완료라고 하지 않는다.
- [x] **R5 · API · R4 후:** service/provider/route 테스트에서 성공·실패·무근거 무호출·요청 1회 상한·원문 전송 범위·키 비노출을 검사한다. 출처의 지시문을 실행하지 않는 프롬프트/안전한 응답 정책을 확인한다. 테스트는 네트워크와 실제 모델에 의존하지 않는다.
- [x] **M3 · Main · C5+R5+U3 후:** 세 writer를 멈추고 실제 Retriever+EvidenceValidator+OpenRouterProvider를 ask-runtime에 조립한다. exports·통합 fixture·상태 UI를 대조하고 test/eval/lint/build를 실행한다. core validator 거부를 service가 답변 보류로 처리하는 통합 검사를 포함한다(G2).

**G2 완료:** 실제 코어·검증기와 API가 결합되고 모든 실패에서도 검색 근거가 보존된다. 실제 무료 모델 성공은 G3에서 별도로 확인한다. provider 장애가 검색 배포를 막지 않게 한다.

### Phase 4 — A안 UI·상태·브라우저 검증 (PG2-Frontend + Main, P0/P1 분리)

- [x] **U3 · Frontend · G1-local 후:** `answer-panel.tsx`, 기존 UI/client 파일에서 네 정상 status와 입력/네트워크 오류·warnings·검증된 인용→근거 focus를 구현한다. pending·중복 submit 방지·오래된 응답 차단·안전한 text 렌더링을 적용한다. Main 소유 shared fixture로 API agent와 독립 검증한다. 375/390px·1280px에서 Pretendard/긴 ID/원문을 읽을 수 있어야 한다.
- [ ] **U4 · Frontend · U3 후, P1:** FR-15 예시 3개, FR-16 심화 keyboard/aria-live/대비·200% 확대·320px, FR-17 세분화된 loading/429 문구, 여유 시 시각 간격을 다듬는다. A안·Pretendard·기본 폼 label·비활성 MCP는 유지한다. G2는 U3만 기다리고 U4는 지연시키지 않는다.
- [ ] **M4 · Main · G2 후:** Main 소유 `apps/web/e2e/ask.spec.ts`, Playwright 설정으로 실제 서버의 검색/버전/quote/확장/무근거/키 없음/비활성 MCP를 검증한다. 실제 AI는 별도 통제된 1회 확인과 조건·예외 수동 평가를 수행한다. 위임 권한·NFC 조건·시동 권한을 대조한다. 실제 성공 미확인은 FR-07 미확인으로 기록하고 전체 A–E 완료라 하지 않는다. U4는 해당 파일 소유권을 지키며 병행할 수 있으나 최종 브라우저 검사 전에 멈춘다.

**G3 완료:** 실제 사용자 흐름·안전·기본 모바일 화면이 동작하고 실제 모델 성공/미확인을 구분한 기록이 있다. P1 보류 항목을 표시한다.

### Phase 5 — 최종 배포·실측·인수인계 (Main 순차, P0)

- [ ] **M5 · Main · M2+M4 후:** 모든 writer를 멈추고 P1 반영 여부를 확정한다. 깨끗한 설치 기준 `npm ci`, `npm run test`, `npm run eval`, `npm run lint`, `npm run build`, `npm run test:e2e`를 실행하고 실패를 수정한다. 최종 검사 중에는 코드·lockfile·설정을 동시에 바꾸지 않는다.
- [ ] **M6 · Main · M5 후:** 최종 production 커밋/배포를 고정하고 Vercel 환경변수·Root Directory·정적 번들을 점검한다. §9의 배포 검증 체크리스트를 실제 URL에서 수행한다(G4). 실제 UI가 preview와 다른 커밋이면 최종 URL에서 다시 확인한다.
- [ ] **M7 · Main · M6 후:** README, workspace README, `docs/decisions.md`에 실제 설치/실행법·URL·커밋·결과·P1 보류·제공자 한계와 발표 순서를 기록한다. 전체 A–E 필수 수용 기준 충족 여부를 판정한다. 구현 단계마다 변경 파일/실행 명령과 결과/한계/다음 단계 보고를 남긴다.
- [ ] **O1 · Main · M7 후, P1:** 여유 시 `.github/workflows/ci.yml`에 비밀 없는 install/test/eval/lint/build를 추가한다. 배포를 기다리게 하지 않으며 추가 후 실제 workflow 결과는 별도 확인한다.

## 4. Dependency Graph

```mermaid
flowchart TD
  B0["B0 설정·설치 / Main"] --> B1["B1 계약 확정 / Main"]
  B1 --> B2["B2 shell·G0 / Main"]
  B2 --> C1["PG1 Core: C1 → C2"]
  B2 --> U1["PG1 Frontend: U1 → U2"]
  B2 --> R1["PG1 API: R1 → R2"]
  C1 --> M1["M1 실물 연결·G1-local / Main"]
  U1 --> M1
  R1 --> M1
  M1 --> M2["M2 Preview·G1-preview / Main"]
  M1 --> C3["PG2 Core: C3 → C4 → C5"]
  M1 --> R3["PG2 API: R3 → R4 → R5"]
  M1 --> U3["PG2 Frontend: U3"]
  U3 --> U4["U4 P1 선택 작업"]
  C3 --> M3["M3 실검증기 연결·G2 / Main"]
  R3 --> M3
  U3 --> M3
  M3 --> M4["M4 실제 흐름·모델·G3 / Main"]
  M2 --> M5["M5 최종 동결·전체 검사 / Main"]
  M4 --> M5
  U4 -. "채택한 변경만 인수" .-> M5
  M5 --> M6["M6 production·실제 URL·G4"]
  M6 --> M7["M7 기록·최종 판정"]
  M7 -. "시간 있을 때" .-> O1["O1 CI / P1"]
```

그림의 연속 ID 노드는 그 안의 TODO를 순차 수행한다는 뜻이다. **병렬 가능한 것은 형제 branch의 구현**이다. Core 실물 대기 없이 API는 fake Retriever/Validator, UI는 fixture로 진행하지만 G1/G2에서는 반드시 실물로 교체한다. C4 미완료 상태에서 AI 답변을 production에 활성화하지 않는다.

**병렬화 불가:** 설치/lockfile 갱신 → 공통 계약 확정, 실물 조립, 같은 파일의 수정, 최종 빌드·배포 대상 커밋 확정, 배포 후 해당 URL 검증. Vercel 업로드 완료를 기다리는 동안 독립된 PG2 구현은 가능하다.

## 5. Parallel Execution Groups / Integration Gates

| 그룹 | 진입 조건 | 병렬 작업 / Main 역할 | 통합 게이트·완료 조건 |
| --- | --- | --- | --- |
| 준비 | 없음 | Main B0→B1→B2; subagent 구현 금지 | **G0:** 계약/ownership 확정, 실제 smoke/test/lint/build 통과 |
| **PG1** | G0 | Core C1→C2 / Frontend U1→U2 / API R1→R2. Main은 계정·배포 설정 확인과 테스트 검토만 수행 | **G1-local(M1):** 실제 JSON/core/API/UI 연결, 키 없는 정상/무근거·버전 필터·원문 확인, test/lint/build |
| 조기 배포 | G1-local | Main M2. 3 subagent는 PG2 시작 가능; Main은 배포 커밋 고정·Git 연동/임시 checkout 배포 | **G1-preview:** 실제 Preview URL, monorepo/JSON 번들·검색 동작 확인 |
| **PG2** | G1-local | Core C3→C4→C5 / API R3→R4→R5 / Frontend U3(→U4 P1). Main은 exports·테스트 증거 검토, 중복 코드 수정 금지 | **G2(M3):** 실제 검증기 주입, 전체 test/eval/lint/build, UI status 일치·unsupported 답변 보류 |
| 회귀·보완 | G2 | Main M4; Frontend의 U4만 소유 파일에서 병행 가능. Core/API는 대기 또는 read-only 리뷰 | **G3:** 실제 브라우저/모바일/MCP/예외 의미 확인; 모델 실호출 결과는 별도 기록 |
| 최종 | G1-preview+G3 | Main M5→M6→M7, 필요 시 O1. writer 모두 종료·인수 | **G4:** 최종 전체 검사, production URL 수동 확인, 미충족 P1/외부 장애 공개 |

Gate 실패 시 해당 파일 owner에게 범위를 좁혀 재할당한다. UI 실패 때문에 Core를 재구현하거나, 단위 성공만으로 배포 검증을 생략하지 않는다. Main이 타 owner 파일을 수정해야 하면 먼저 writer를 멈추고 소유권을 회수한다.

## 6. Agent Assignment & File Ownership

아래 경로는 저장소 루트 기준이며, **하위 디렉터리 전체 소유보다 명시한 예외가 우선**한다. 소유권은 Gate 사이에 고정한다. 동일 파일에 writer가 두 명 생기지 않게 한다.

| 담당 | 수정 가능 파일/디렉터리 | 수정 불가·읽기 전용 | 선행 / 인수 조건 |
| --- | --- | --- | --- |
| **Main / Integrator** | 루트 package/lock/tsconfig/Vitest/Node 설정, 모든 workspace manifest·설정, `.env.example`, `.gitignore`, `spec-core/src/{types,interfaces,index}.ts`, `web/src/contracts/**`, `web/src/server/{corpus,ask-runtime}.ts`, `web/src/test-fixtures/**`, `web/src/integration/**`, `tests/smoke.test.ts`, `web/e2e/**`, Playwright 설정, 문서·CI·Vercel 설정 | 활성 agent 소유 소스는 동시 수정 금지 | B0–B2/계약 확정 후 위임; M1/M3/M5–M7 전체 통합·검증 책임 |
| **Core Agent** | `packages/spec-core/src/{corpus,retriever,evidence,synonyms,evidence-validator}.ts` 및 같은 이름 `.test.ts`, `evals/run.ts`, `evals/additional-cases.json` | 공통 types/interfaces/index, manifests/lockfile, 기존 `data/demo/**`, `evals/questions.json` | G0 후 C1/C2; G1-local 후 C3–C5. 단위·실제 eval 결과와 필요한 export 목록 제출; M3 전 eval은 구현 모듈을 직접 참조하여 새 public export를 기다리지 않음 |
| **Frontend Agent** | `apps/web/src/app/{layout,page}.tsx`, `globals.css`, `src/components/**`, `src/client/**`, 해당 영역 colocated 테스트·fixture, `src/assets/fonts/**` 및 폰트 license | API route, server/**, shared contracts/fixtures, manifests/lockfile, DESIGN/비교 HTML | G0 후 U1/U2; G1-local 후 U3/U4. A안/Pretendard·상태·원문·MCP 확인, production fake 없음 |
| **API Agent** | `apps/web/src/server/{ask-service,request-validation}.ts` 및 colocated 테스트, `src/server/llm/**`, `src/app/api/ask/{route.ts,route.test.ts}` | Main 소유 corpus/runtime/계약, UI/**, Core/**, manifests/lockfile | G0 후 R1/R2; G1-local 후 R3–R5. fake 의존성 단위 검사와 상류 실패·보안 결과 제출 |

B2까지 Main이 만든 `app/layout/page/globals.css`는 **G0에서 Frontend로 소유권 이전**한다. Gate 통합은 Main 소유 파일에 한정하며 기존 owner가 작업을 마치기 전 해당 경로를 건드리지 않는다. 신규 파일이 위 표에 없으면 먼저 Main에게 경로를 배정받는다. 하나의 `apps/web/**` blanket 소유권은 주지 않는다.

### 공통 계약 동결 항목 (B1 → G0)

- `Evidence`: citationId/documentId/documentTitle/version/sectionId/requirementId/quote/fullText/score? 필드 및 `SRC:DKSI-SYNTHETIC:Vx:...` 규칙.
- AskRequest/AskResponse 네 status, invalid input ApiError JSON, warnings를 표시하는 방법, versions 생략/빈 배열·topK·문자 수 기준. client가 server 모듈에서 타입을 import하지 않게 한다.
- Retriever 검색/조회 함수의 이름·sync/async·입출력·export, SyntheticCorpusProvider 생성자, Validator 입력(원본 registry+검색 evidence+candidate)/결과(유효 여부·경고), LLMProvider 입력·모델 출력 schema. provider 구현은 web에, 타입만 core에 둔다.
- `createAskService(dependencies)`와 Main의 `getAskService()` 조립점, route의 import 경로, production은 실제 의존성 사용·테스트만 fake 허용 규칙.
- Main 소유 shared fixture는 **원본 JSON에서 생성한 evidence**와 정상/무근거/fallback/모델 실패 후보다. 모든 agent는 읽기만 하며 독자적인 계약 복사본을 만들지 않는다. 악성·변조 fixture는 각자의 테스트 영역에 한정한다.

계약 변경이 필요하면 agent가 이유·영향 파일·관련 테스트를 Main에게 전달한다. Main이 영향받는 writer를 멈춘 뒤 공통 타입/fixture를 수정하고, 변경 내용을 동시 통보해 작업을 재개한다. 버전 체계나 별도 공유 패키지를 늘리기보다 작은 계약을 유지한다.

### 운영·인수 규칙

- Main이 각 agent에 **작업 ID, 허용 경로, 선행 Gate, 완료 조건, 읽을 계약/디자인, 금지 범위**를 담아 지시한다. 서브 에이전트의 재위임은 하지 않으며 최대 3개만 활성화한다.
- 같은 workspace를 공유하는 기본 실행에서는 변경이 즉시 보인다. Main만 install/commit/merge/push/배포하고, subagent는 파일 편집과 자기 영역 테스트만 한다. 다른 작업자의 변경을 지우는 reset/checkout/stash나 전체 format은 하지 않는다. 별도 worktree는 실제 충돌 위험이 생길 때만 Main이 만들고 통합 순서를 정한다.
- subagent는 완료 시 **변경 파일 / 실행 명령·실제 결과 / 미실행·한계 / Main 연결 필요 사항**을 보낸다. 파일을 만들었음과 실제 통합 통과를 구분한다.
- agent가 빨리 끝나면 read-only 교차 검토나 자기 소유 테스트를 수행한다. 다른 agent 소스를 임의 수정하지 않는다. 대기 시간이 구현 시간보다 길거나 작업이 매우 작으면 두 agent로 줄여 Main이 마무리한다.
- 각 Gate 전 writer 일시 정지 → 범위 이탈 diff 확인 → 실물 연결 → 테스트 → 결과 기록 → 다음 그룹 시작. `.next`/coverage 등 출력 디렉터리를 경쟁해서 쓰는 build/E2E는 Main만 실행한다.
- 독립 단위 테스트는 특정 파일로 제한하고 가능하면 coverage를 끈다. 공유 포트·dev server는 Main이 하나만 관리한다. agent별 `npm install`, 전체 build, 전체 snapshot 갱신은 금지한다.

### 예상 병목과 시간 제한 시 순서

전체 시간은 3분의 1로 줄어든다고 가정하지 않는다. 대략 `기반 + max(Core1, UI1, API1) + 통합1 + max(Core2, UI2, API2) + 통합2/회귀 + 최종 배포`이며 Preview 대기는 PG2와 겹칠 수 있다. 추정 분 단위 약속보다 Gate별 실제 시간을 보고 재배치한다.

1. B0/B1(도구·계약)과 M1/M3(실물 조립)은 공통 병목이다. Main은 디자인 재탐색 대신 이 경로를 먼저 푼다.
2. 한국어 검색 품질(C3)과 인용 보류 연결(C4/R4)은 검증 병목이다. API agent가 Core를 기다리지 않게 fake 계약을 쓰되 실제 통합 검증은 생략하지 않는다.
3. Vercel 권한·정적 JSON 번들·무료 모델 가용성은 외부 병목이다. G0에서 권한, M2에서 배포 경로를 조기 확인하고 provider가 불가해도 검색 Preview를 유지한다.
4. 남은 시간이 적으면 U4/O1/동의어 확장·미세한 시각 조정을 먼저 보류한다. P0에서 막히면 기능을 임의 삭제하지 말고 검색 전용 체크포인트와 미충족 FR-07/11 등을 명시한다.

## 7. Acceptance Criteria / PRD Traceability

Phase 번호는 기능별 매핑이며 병렬 시작 시점은 §5를 따른다. P0는 G4의 필수 기준이다. P1은 보류 가능하지만 미충족 목록을 남기며 전체 PRD 완료라고 표시하지 않는다. 테스트는 owner가 제출하고 최종 통과 판정은 Main이 내린다.

| 요구사항 | 작업 ID / Gate · 구현 Phase / 주요 파일 | 완료 증거 |
| --- | --- | --- |
| FR-01 | C1/C2 · G1 · 1 / corpus + 기존 JSON | 각 16개, synthetic, >=2 변화·조건/예외, 고유 ID·참조 검사 |
| FR-02 | B1/R1/U2 · G1/G2 · 1/3/4 / route, ask-panel | 한/영, blank·501자·잘못된 타입 거부; 500자 수용 |
| FR-03 | C2/C3/C5 · G2 · 1/2 / retriever, evals/run | 기본 5개, 모든 기대 ID top-5, 결정적 ID/정렬 |
| FR-04 | C2/C5/U3 · G2/G3 · 1/2/4 / retriever, UI | V1/V2/all; 검색·답변·원문에서 타 버전 누출 0 |
| FR-05 | C2/U1 · G1/G3 · 1/2 / evidence, evidence-card | 문서명·버전·Section·Requirement ID·정확 quote |
| FR-06 | U1/M4 · G3 · 1/4 / evidence-card | 전체 원문 펼침/접기 및 fixture와 일치 |
| FR-07 | R3/R4/M4 · G3/G4 · 3 / server/llm | server-only 무료 모델 한국어 답변 실제 확인 |
| FR-08 | C4/R4/M3 · G2 · 2/3/4 / validator, response parser | 위조/미검색/교차 버전 ID 및 quote 변조 거부, 의미 검증 한계 안내 |
| FR-09 | R1/C3/M3 · G2 · 1/2/3 / ask-service | Q8 및 추가 무관 질문: insufficient_evidence, answer=null, 호출 0 |
| FR-10 | R5/U3/M3 · G2 · 1/3/4 / provider, status UI | 키 없음/429/error/timeout/malformed에도 동일 sources 사용 |
| FR-11 | M2/M6 · G1-preview/G4 · 1 Preview, 5 최종 | 실제 Vercel URL과 수동 확인 기록 |
| FR-12 | U1/M4 · G3/G4 · 1/4 / page, e2e | dim + disabled + aria-disabled, href/라우트/탐색 없음 |
| FR-13 | U1/M6 · G1/G4 · 1/4/5 / layout/page | 지정 합성 경고 상시 노출, 내부 자료 요청 없음 |
| FR-14 (P1) | C3 · G2(선택) · 2 / synonyms | 한영 >=5쌍 및 표현 변형 검색 |
| FR-15 (P1) | U4 · G3(선택) · 4 / ask-panel | 질문 action 3개 동작 |
| FR-16 (P1) | U3/U4 · G3 · 4 / components, CSS | 375px/1280px 및 keyboard 수동 확인 |
| FR-17 (P1) | U3/U4/R5 · G2/G3 · 3/4 / service/UI | loading/429/fallback 구분, 중복 전송 방지 |

## 8. Testing & Integration Strategy

검사 순서와 담당: G0 Main 기반 검사 → PG1 각 agent 단위 → G1 Main 실물 통합 → PG2 각 agent 단위/평가 → G2 Main 실제 validator 포함 통합 → G3 Main 브라우저·의미 확인 → G4 Main 최종 배포. Mock 성공만으로 Gate를 넘지 않는다.

- **단위(Vitest)**: 코퍼스 구조·복합 ID·참조·원문 보존, query 정규화/동의어, 버전 제외, topK 경계 1/8과 잘못된 값, 안정적 순위, quote substring, 존재하지만 미검색인 ID와 위조 ID를 검사한다.
- **RAG 품질**: Q1–Q10의 원래 기대값을 유지한다. 양성 9개는 각 케이스의 모든 기대 ID가 top 5에 포함되어야 한다. 음성 Q8과 추가 무관 질문은 빈 근거여야 한다. 질문별 결과/실패 사유와 기대 ID 회수율을 출력한다. 이 작은 fixture 결과를 일반적인 검색 정확도로 홍보하지 않는다.
- **계약/통합(Vitest)**: Route Handler → 실제 코어 → fake LLM. 400/413, 응답 status, 무근거 무호출, 키 없음, 정상/429/5xx/timeout/네트워크/malformed/위조 인용, 호출 1회 상한, sources 보존을 검증한다.
- **브라우저(Playwright + 수동)**: 실제 API 검색 경로, 버전 변경, 원문 expansion, 오류 복구, 중복 전송 방지, inert MCP, 모바일 레이아웃을 확인한다. 실제 외부 모델은 자동 회귀의 필수 의존성에서 제외한다.
- **근거의 의미 수동 검토**: 위임 권한 subset/추가 위임 금지, NFC 권한 및 suspended 거부, entry-only와 시동 구분을 체크한다. 정확한 quote만 있는 오해의 소지가 있는 답변도 실패로 기록한다. 완전한 자동 entailment 판정은 목표가 아니다.
- **빌드/안전**: 루트 scripts가 실제 실패를 전달하는지 확인하고, Vercel에서 workspace·JSON 번들 포함과 Node runtime을 검사한다. tracked 파일과 Git 이력에 secret/private 파일 흔적이 있는지 값 비노출 방식으로 확인한다. 실자료 폴더를 열거나 원문을 수집하지 않는다.
- **Skill 별도 검증**: `.agents/skills/`는 수정·실행 의존성에 넣지 않는다. 전체 Skill activation/negative/adversarial 시험은 별도 수동 Codex 세션 기록으로만 인정하며 Web 테스트 통과로 대체하지 않는다. Web 배포의 선행조건으로 추가하지 않는다.

## 9. Vercel Deployment Plan

1. Phase 0에서 Next/Vercel/npm workspace 공식 문서로 지원 설정을 확인한다. 저장소를 Vercel 프로젝트에 연결하고 Framework=Next.js, Root Directory=`apps/web`으로 설정한다. 루트의 workspace/`data/demo` 파일을 빌드에 포함할 수 있는 상위 경로 접근 설정을 확인한다.
2. 루트 lockfile 기준 설치가 이루어지게 설정한다. 기본 auto-detection을 먼저 확인하고, 필요하면 저장소 루트에서 설치하도록 명시한다. Build는 web workspace를 대상으로 하며 core 빌드가 필요하면 선행한다. Output Directory는 Next.js 기본값을 사용한다.
3. M2 Preview는 키 없이 배포해 검색과 정적 데이터 번들링을 검증한다. `apps/mcp`, `.agents/skills`, 로컬 자료가 런타임 코드로 연결되지 않아야 한다.
4. Preview/Production의 서버 환경변수를 각각 설정한다. `OPENROUTER_API_KEY`는 선택적 secret, `OPENROUTER_MODEL=openrouter/free`가 기본이다. 키를 Git/클라이언트 props/응답/로그에 넣지 않는다. 설정 변경 후 재배포한다. 공개 `NEXT_PUBLIC_*` secret은 없다.
5. 기본 무료 라우터와 무료 모델 allowlist 외 유료 호출을 거부한다. 제공자 정책이나 privacy 옵션이 무료 라우팅과 충돌하면 실패를 fallback으로 처리한다. 실자료 전송 옵션·source/provider selector는 공개 MVP에 만들지 않는다.
6. **아래 checklist는 모두 M6 / Main / M5 완료 및 production 배포 후 수행**한다. production 배포 후 아래를 실제 URL에서 검사하고 URL·배포 시각·커밋·검사 결과를 README 또는 결정 기록에 남긴다.

- [ ] **D1 · M6 하위 검사 / Main / P0:** 합성 경고와 disabled MCP, 모바일/데스크톱 화면 확인.
- [ ] **D2 · M6 하위 검사 / Main / P0:** Q1(V1), Q3(V2), Q5(all)의 top-5와 원문 확장 확인.
- [ ] **D3 · M6 하위 검사 / Main / P0:** Q8 무근거와 invalid POST 검증; 모델 호출 없음 확인.
- [ ] **D4 · M6 하위 검사 / Main / P0:** 실제 AI 응답과 인용·조건을 수동 대조. 일시적 제공자 장애는 실제 발생 상태로 기록.
- [ ] **D5 · M6 하위 검사 / Main / P0:** 키 없는 Preview에서 검색 전용 확인; timeout/429는 자동 통합 테스트 또는 별도 통제된 환경에서 재현. 실제 장애가 없었다면 live 재현 완료라고 쓰지 않는다.
- [ ] **D6 · M6 하위 검사 / Main / P0:** 브라우저 네트워크/클라이언트 산출물에서 키·서버 설정 비노출, 콘솔 오류와 API 응답 확인.
- [ ] **D7 · M6 하위 검사 / Main / P0:** Vercel 배포 로그·함수에 루트 JSON 누락이나 런타임 쓰기 의존성이 없는지 확인.

Vercel 계정 접근/프로젝트 연결/secret 설정 권한이 없다면 필요한 외부 조치만 요청한다. 공개 MVP는 개인 비상업적 학술 시연용이며 회사 운영으로 전환하지 않는다.

## 10. Risks & Mitigations

| 위험 | 대응 및 검증 |
| --- | --- |
| 병렬 수정·공통 계약 변경 | Main 소유 exports/계약/lockfile, 경로별 writer 1명, Gate 중 정지 및 명시적 소유권 이전 |
| fake 성공·통합 지연 | 개발 중 fake 허용, G1/G2 실제 조립 강제, API·validator·UI를 함께 확인 |
| agent 슬롯·중복 도구 작업 | 최대 3 subagent, 재위임 없음, install/build/배포 Main 단독; 효과 낮으면 2개로 축소 |
| 무료 모델 가용성·쿼터·429 | 키 없는 검색을 먼저 배포; 1회/10초 상한, 출력 제한, 자동 재시도·유료 전환 없음; 성공 확인과 실패 검증을 구분 |
| 공개 endpoint의 반복 호출·비용/쿼터 소진 | 500자/본문/topK/출력 제한, UI 중복 방지, 배포 플랫폼에서 사용 가능한 요청 제한 확인; 저장소/DB 없이 적용. 인스턴스 메모리 제한만으로 전역 rate limit을 보장한다고 주장하지 않으며 필요 시 AI 키를 제거해 검색 전용 유지 |
| 한국어 lexical recall 부족 | >=5 동의어와 보수적 token/prefix/fuzzy, 기존 10개와 표현 변형 eval; embedding으로 오표기하지 않음 |
| 일반 용어 적중이 무관한 근거로 연결 | 음성 질문과 최소 적중 조건 점검; 애매하면 보류/한계 표시. 검색 점수를 의미적 확신으로 사용하지 않음 |
| 유효 인용을 단 오해·조건 누락 | 전체 Requirement quote, 조건·예외 보존 프롬프트, 위조 인용 보류, 수동 논리 검토; expert-reviewed 보장 금지 |
| prompt injection/XSS | 출처는 데이터로만 취급, tool 실행 없음, 모델/질문 raw HTML 렌더링 없음, 응답 스키마와 인용 allowlist |
| 비밀·실제 CCC 자료 유출 | 서버 전용 키, 합성 파일 명시적 import, `/data/local/` ignore, 로그 최소화, tracked 파일/이력/번들 검토 |
| 모노레포 root 밖 JSON 누락 | Phase 1 조기 Preview; 깨끗한 설치·build·실제 API로 번들 검증. 런타임 파일 복사로 우회하지 않음 |
| 시연 당일 범위 과잉 | 검색 전용 Vertical Slice 선행, AI 추가, UX 마무리 순서. MCP/PDF/DB/인증/복잡한 비교 엔진 제외; P0 누락을 완료로 숨기지 않음 |

## 11. Out of Scope / Future Work

이번 A–E에서는 다음을 구현하지 않는다.

- Local stdio MCP(F), 실제 MCP tool/server/endpoint/page 및 가짜 MCP 시연.
- 실제 CCC V3.1.4/V4.1.0 파일 확보·열람·파싱·색인, 사용자 업로드, `data/local` 처리, 로컬 Web 모드, Ollama·외부 실자료 전송 게이트.
- vector/embedding/hybrid retrieval, reranker, 전용 버전 diff/영향 분석 엔진, cross-spec 관계 그래프.
- 로그인·DB·사용자 질문/답변 영속화·회사 통합·ACL·공유 지식 저장소·분석 추적.
- Skill 파일을 웹앱이 실행하는 기능, 신규 Skill 확장, Skill을 RAG/MCP 구현으로 포장하는 동작.

공유 네 가지 인터페이스와 무결한 원문·버전·인용 계약만 미래 확장 지점으로 남긴다. 후속 로컬 실증은 문서 이용 권한·조직 정책을 확인한 별도 계획으로 수행한다.

## 12. 문서 충돌·모호함 및 확인 사항

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
| 기존 계획은 P1 전체 완료를 선행조건처럼 표현 | 이번 사용자 요청에 따라 P0 우선·P1 보류 가능으로 변경. 보안/원문/기본 사용성은 유지하고 보류 FR을 공개 |
| 디자인·폰트·메뉴 | A안 Clear Desk와 Pretendard 확정 반영. 메뉴 형태 재검토는 실제 항목이 필요할 때; 이번은 비활성 MCP 유지 |
| 배포 계정/프로젝트/도메인, Vercel Node 및 실제 무료 모델 지원 | Phase 0/1에 확인; 커스텀 도메인은 필수가 아니며 생성된 live URL로 충분 |

이 항목들은 계획 검토 결과이며 이번 작업에서 기존 요구사항 문서를 수정하지 않는다. 실제 구현 때 새로운 결정·범위 이탈은 `docs/decisions.md`에 기록한다. 설치 버전과 계정 설정 외에는 현 정보로 Phase 0을 시작할 수 있으며, AI 제공자 장애는 검색·근거 배포를 막지 않게 한다.

## Implementation log — 2026-10-29

- G0: manifests/lockfile/Node 24/config/contracts/shell/shared fixture added. `npm install` (0 vulnerabilities), `npm ci --ignore-scripts`, `npm run test` (1/1), `npm run lint`, `npm run build` passed. Next.js 16.4.3, Vitest 5.0.5, MiniSearch 7.2.0. No search/AI implementation claimed yet.
- External blocker: `vercel whoami` rejected existing token. User asked to choose login or manual handoff; work continues independently. OpenRouter key setup requested without exposing any key.

- G1-local: Core/API/Frontend three-agent implementations integrated using actual JSON and retriever. `npm run test` 57/57, lint/build passed; Playwright `npm run test:e2e` 5/5 (real API fields/version, UI search/expansion, unsupported query, 375/1280px no overflow). M2 Preview remains blocked by invalid Vercel authentication. Dev server running at http://localhost:3000 with `.next-dev` isolated from production `.next`.

- G2: actual SourceEvidenceValidator + OpenRouterProvider composed. `npm run test` 159/159, `npm run eval` 18/18 cases and 17/17 expected IDs@5 (0 version leaks), lint/build passed. Original eval/corpus unchanged. Model parser/provider error paths mocked, not actual OpenRouter success. Three independent read-only review agents assigned next.

- Final local regression: Origin normalization fixed and covered for localhost/public HTTPS/cross-origin cases. `npm run test` 163/163, `npm run lint`, `npm run typecheck`, `npm run build` passed; browser tests 7/7 include explicit mocked answered UI (escaped HTML, citation focus), duplicate submit prevention and real search fallback. Independent security/quality/test-gap reviewers completed; suggested P0 test gaps were added. Original demo data, eval labels and Skills remain unchanged.
- Clean-source snapshot `/private/tmp/dksi-release-dl3x5k79`: `npm ci` from lockfile, test 163/163, eval 18/18, lint/build passed independently of the live dev server. Production dependency audit: 0 known vulnerabilities. This is local reproducibility evidence, not Vercel deployment evidence.
- Partial remaining tasks: U4 has examples/basic responsive states implemented, but full assistive-tech/IME/320px/200% audit deferred. M4 browser portion passed; actual model check unavailable because no API key. M5 local clean checks passed, but its M2/M4 prerequisites are not fully satisfied. M6/D1–D7 require actual Vercel URL. M7 documentation/manual deployment guide prepared; final deployment/model outcome pending. O1 CI deferred.
- Authentication recheck: Vercel CLI reports logged out, no local `.env.local` or process OpenRouter key configured. User credential/authentication questions remain pending. Manual steps are in `docs/deployment.md`; A–E overall completion is not claimed.

- Follow-up user request implemented in two parallel agents: full name in header/browser title and semantic Web version policy/display. Main integrated AppRelease above the signature footer. Version uses apps/web/package.json, baseline0.1.0; document V1/V2 remains independent. See docs/versioning.md. Full name/version browser regression passed below.

- Follow-up verification: lint/build passed without application build warnings, Vitest 163/163 and Playwright7/7 passed after full-name/version integration. Browser assertions read the Web package version instead of duplicating a release string. Isolated `npm version patch --workspace @dksi/web --no-git-tag-version` advanced both Web manifest and lock workspace entry to0.1.1; the isolated files were restored and actual baseline remains0.1.0.

### Follow-up user tasks

- [x] **N1 / branding agent:** Full product name in header and browser title; targeted lint passed.
- [x] **V1 / version agent:** Web version policy and manifest-backed AppRelease component; targeted lint passed.
- [x] **I1 / Main / N1+V1:** Place version above signature footer, document policy, verify build/test/browser including mobile overflow.

- Implementation commits: f10d484 (workspace/contracts/core), db91949 (RAG API/fallback), ecd4a81 (A안 UI/browser regressions), 9e45c29 (full name), dae2a24 (Web version policy/display). Documentation/report commit follows. These commits partition the final integrated source by responsibility; the final integrated tree, not every intermediate commit, was tested. No remote push or deployment is claimed.
