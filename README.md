# Digital Key Spec Intelligence (DKSI)

> **Evidence-first Requirement Assistant** — Find the requirement. Show the evidence. State the uncertainty.

KAIST ITM.690 2026-10-29 발표를 위한 공개 합성 데이터 데모와 **실제 CCC V3.1.4/V4.1.0 PDF를 사용하는 후속 로컬 RAG**를 공통 코어로 연결하는 프로젝트. 구체적 설계: [CCC PDF RAG architecture](docs/ccc-rag-architecture.md). 실제 디지털키 개발에서 겪는 문서 검색·조건 해석·버전 혼동·근거 부재·지식 파편화 문제를 출발점으로 한다.

**상태:** A안 Clear Desk·Pretendard Web 앱, 실제 MiniSearch 검색, 근거 카드, 서버 전용 OpenRouter 어댑터와 안전한 fallback을 구현했다. 로컬 `npm run dev`는 [http://localhost:3000](http://localhost:3000)에서 동작한다. **현재 Production은 v0.3.3이며 키워드/AI 검색 전환·실제 AI 답변·원문 인용·모바일 화면을 검증했다.** 키워드는 모델을 호출하지 않으며, 모드 전환으로 이전 결과를 비교할 수 있다. 결과와 절차: [배포 가이드](docs/deployment.md).

> **Public repository safety:** 실제 CCC 사양 원문(배포 권한을 확인하지 않은 자료 포함), 추출 텍스트/정제본/임베딩/인덱스, OEM/사내 문서, 소스·로그, 키·고객/개인정보를 공개 저장소와 Vercel에 추가하지 않는다. `data/demo`에는 독립 창작한 **Synthetic/Fictional** 자료만 보관한다.

## 데이터 정책: 독립 창작 합성 규격과 실제 CCC Spec의 구분

**합성 데이터(Synthetic/Fictional data)**란 CCC PDF에서 문장을 추출·번역·요약·JSON으로 정리하거나 Requirement를 재작성한 **정제본**이 아니다. 디지털키의 공개적인 기술 개념(Owner/Friend Device, Provisioning, Key Sharing, BLE, UWB, NFC, Revocation 등)을 바탕으로 **새로 창작한 가상의 요구사항과 예외·조건·버전 차이**를 뜻한다.

- **공개 데모**: `data/demo/spec-v1.json`과 `spec-v2.json`은 각각 16개의 가상 Requirement를 포함한다. `V1/V2`는 **가상의 버전**이며 **CCC 3.1.4/4.1.0과 대응하지 않는다**. 가상의 식별자, Section 구조, 수치 및 판단은 실제 CCC 규정이나 준수 기준이 아니다.
- **원문 파생 자료**: 실제 CCC PDF의 Markdown/JSON 변환, 원문 Chunk, 상세 재진술, 검색 인덱스·Embedding을 합성 데이터라고 부르거나 GitHub/Vercel에 올리지 않는다.
- **실제 사내 실증**: 권한이 있는 CCC PDF V3.1.4/V4.1.0은 사용자가 직접 `data/local/ccc/`에 배치하고 `data/local/index/`에 파생 인덱스를 생성한다. 두 경로 모두 `.gitignore`에서 제외되어야 한다.
- **외부 LLM**: 공개 Vercel의 OpenRouter에는 **합성 자료만** 전송한다. 실제 CCC 원문이나 발췌문은 적절한 이용·제공 권한을 확인하기 전에는 전송하지 않는다.

### CCC v4.1.0 Legal Notice 검토 메모

운영자가 제공한 *Digital Key Technical Specification v4.1.0* Page 4의 `LEGAL NOTICE`에는 CCC의 저작권, `Confidential` 표시 및 구체적인 이용·제공 조건이 적혀 있다.

- **CCC 회원(Member)**: 제품 구현 목적의 이용·복제 권한이 있지만, 외부 제공은 정해진 **계열사·하도급업체**, **need-to-know**, **유사한 비밀유지 의무** 등의 요건을 충족해야 한다.
- **비회원(non-Member)**: 별도 **Specification License Agreement**가 적용되며, 제공된 Notice는 제한된 **평가 목적**의 라이선스를 설명한다.
- **중요한 구분**: 공식 사이트에서 무료로 다운로드할 수 있다는 사실, GitHub를 Private으로 바꾸는 것, AI 업체의 **학습 금지 약정**은 그 자체로 **원문 재배포 또는 외부 AI 전송 허가**가 되지 않는다.
- 현재 Notice만으로는 개별 외부 AI 제공업체가 허용된 수탁자에 해당하는지 결정할 수 없다. 실제 CCC 원문을 외부 서비스에서 처리하려면 해당 PDF와 다운로드 약관, 적용되는 회원/비회원 계약, 회사의 문서·AI 이용 정책을 검토해야 한다.

본 항목은 문서의 운영상 위험을 정리한 것으로 법률 의견이 아니다. 관련 설계: [CCC PDF RAG architecture](docs/ccc-rag-architecture.md). 공식 안내: [CCC Specification Download](https://carconnectivity.org/digital-key-specification-download-2/).


## Scope: now vs. later

| 단계 | 구현 목표 | 상태 |
| --- | --- | --- |
| **A** | 합성 규격 2개 버전(V1/V2)과 Requirement ID | 구현·원문 검사 완료 |
| **B** | MiniSearch 기반 요구사항 검색, 버전 필터 | 로컬 구현·검증 완료 |
| **C** | 정확한 문서·버전·Section·ID·원문 근거 카드 | 로컬 구현·검증 완료 |
| **D** | 서버 측 OpenRouter 무료 모델 답변 + 실패 시 검색 폴백 | 구현·자동 검사 및 실제 AI 답변·인용 확인; 무료 모델 변동성은 fallback 처리 |
| **E** | Next.js Web MVP를 Vercel에 배포 | Production v0.3.3; 핵심 live 검증 완료 |
| **F** | 공통 검색 코어를 사용하는 **Local MCP** | 다음 단계 (웹 메뉴만 disabled / Coming soon) |

**이번 발표 A–E:** 합성 데이터 Web RAG와 Vercel + OpenRouter 무료 모델 배포. **후속 사내 실증(F):** 사용자가 보유한 CCC PDF 두 개를 `data/local/ccc/`에서 로컬 파싱·색인하고, **Local MCP**를 통해 회사에서 승인한 Codex·Claude·Gemini 에이전트에 근거를 제공한다. **Ollama 설치나 별도 LLM API는 필수가 아니다.** 로컬 MCP의 도구 결과가 연결된 모델에 전달될 수 있으므로, 사내 승인 범위에서만 사용한다. 개인 OpenRouter에 실제 스펙 발췌를 보내는 기능은 별도 권한 확인·명시적 허용 전까지 비활성화한다.

## Architecture

```text
apps/web (Next.js + Vercel)
 ├─ Search UI / version selection / evidence cards
 └─ POST /api/ask ─┬─ packages/spec-core (MiniSearch + citation validation)
                  └─ OpenRouter free LLM (server-only, optional)
                           ↑
                data/demo (synthetic V1/V2)
apps/mcp (future local stdio MCP; not implemented)
 └─ will reuse packages/spec-core without cloud dependency
```

MiniSearch는 **키워드 기반 full-text search**다. 첫 버전에서는 한·영 용어 매핑과 메타데이터 검색을 사용하며, 임베딩 기반 semantic search라고 주장하지 않는다. 질문에 답할 근거가 없으면 추측하지 않는다. LLM 키가 없거나 무료 모델 호출이 실패해도 검색·원문 확인은 작동해야 한다.

## Repository layout

```text
.
├── README.md
├── AGENTS.md                 # Codex 지침: 구현 및 안전 규칙
├── PRD.md                    # 기능, 인터페이스, 수용 기준
├── .gitignore
├── .env.example              # 비밀 값 없는 예시
├── package.json              # npm workspace 최소 설정
├── apps/
│   ├── web/README.md         # Next.js 앱 구현 자리
│   └── mcp/README.md         # F 단계 전용 placeholder
├── packages/
│   └── spec-core/README.md   # Web/MCP 공통 검색 코어 자리
├── data/demo/
│   ├── spec-v1.json
│   └── spec-v2.json
├── evals/questions.json
└── docs/decisions.md
```

루트 lockfile로 workspace 의존성을 고정한다. `DESIGN.md`는 A안·Pretendard 기준이며 비교 HTML은 고정 데이터 디자인 기록일 뿐 앱 런타임이 아니다.

Web 버전은 `apps/web/package.json`을 기준으로 footer 위에 표시한다. Major/Minor/Patch 증가 기준과 배포 절차는 [버전 관리 정책](docs/versioning.md)을 따른다. 현재 배포 버전은 `0.3.3`이다.

## Getting started

Node.js 24.x, npm 11+ 필요. 키를 설정하지 않아도 실제 검색과 원문 확인이 동작한다.

```bash
npm ci
cp .env.example .env
# 루트 .env에 OPENROUTER_API_KEY 설정 (선택)
# apps/web/.env.local도 지원하며 기존 환경변수와 앱 설정이 우선
npm run dev
npm run test
npm run eval
npm run lint
npm run build
npm run test:e2e
```

- `OPENROUTER_API_KEY`: 서버에서만 사용, 미설정 시 검색 전용 모드.
- `OPENROUTER_MODEL`: 기본 `openrouter/free`; 무료 모델 가용성/호출 한도는 변동 가능.
- 배포 환경의 모델과 API 키는 Vercel 서버 환경변수에 입력한다. `NEXT_PUBLIC_` 접두사 사용 금지.
- Vercel에서는 `apps/web`을 Root Directory로 선택하고, npm workspaces 경로 해석·빌드를 검증한다.
- **배포 URL:** [Digital Key Spec Intelligence](https://digital-key-spec-intelligence.vercel.app). v0.3.3과 실제 검색 모드 전환·AI 응답을 확인했다. 검증 범위·한계와 프로젝트 설정은 [배포 가이드](docs/deployment.md)를 참고한다.
- 브라우저 검사는 설치된 Google Chrome과 포트 3100의 프로덕션 서버를 사용한다. dev는 `.next-dev`, production은 `.next`를 사용해 동시에 검증할 수 있다.
- 실제 OpenRouter 서버 API 수동 검증: 3회 중 1회 `answered`(topK1, V2 REQ012, 한국어·정확 인용), 1회 인용 보류·1회 timeout. 자동 재시도는 없으며 무료 모델의 일반적인 성공률로 해석하지 않는다.
- 실제 실행 결과: Vitest **215개**, 검색 평가 **21개**(기대 ID 21/21 top-5, 버전 누출 0), 브라우저 **16개**, lint/typecheck/build 통과. 작은 합성 코퍼스 평가이며 일반 정확도나 논리적 함의 보증이 아니다. 자동 모델 응답 UI 검사는 stub이며, 별도의 실제 Production AI 응답·인용·모드 전환 검증 기록은 [배포 가이드](docs/deployment.md)에 있다.

## MVP demo flow

1. `Synthetic demo — not an official specification` 경고를 확인한다.
2. 질문을 입력하고 V1/V2 버전을 선택한다.
3. 상위 Requirement와 문서명/버전/Section/ID/정확한 원문을 확인한다.
4. 무료 LLM이 가능하면 근거를 기반으로 답변을 생성하고 인용을 검증한다.
5. 근거가 없거나 LLM이 실패해도 안전한 결과/폴백이 표시된다.
6. 내비게이션의 **Local MCP — Coming soon**은 dim + disabled 상태다.

## Repository-local Agent Skills (course demonstration)

The repository includes **two actual `SKILL.md` workflows** under `.agents/skills/`:

| Skill | Usage in Codex | What it does |
| --- | --- | --- |
| [spec-requirement-navigator (사용 안내)](.agents/skills/spec-requirement-navigator/README.md) · [SKILL.md](.agents/skills/spec-requirement-navigator/SKILL.md) | `$spec-requirement-navigator` + a fictional V1/V2 requirement question | Find matching clauses, inspect cross-references, interpret conditions, and cite exact source evidence. |
| [spec-answer-auditor (사용 안내)](.agents/skills/spec-answer-auditor/README.md) · [SKILL.md](.agents/skills/spec-answer-auditor/SKILL.md) | `$spec-answer-auditor` + a candidate answer with citations | Validate source IDs, quotes, versions and claim-to-evidence support; mark unsupported inferences. |

See the [Skill roadmap, demo script and acceptance tests](docs/skills-plan.md). The Skill is an **agent instruction/workflow**, not a running search API. It can inspect committed synthetic JSON in Codex now; it will use **Local MCP tools later** when they actually exist. **Vercel does not run these Skills**; the public RAG Web UI is a separate demo surface. On 2026-10-29, both Skills were explicitly invoked in one live Codex conversation using synthetic V2: [Navigator question and answer](.agents/skills/spec-requirement-navigator/example.md), followed by [Auditor question and answer](.agents/skills/spec-answer-auditor/example.md). This records one manual scenario per Skill, not completion of the activation/non-activation or adversarial regression tests.

## Local MCP vision (not MVP)

팀원이 각자 승인된 로컬 문서를 색인하고, 회사에서 승인한 Codex·Claude·Gemini의 MCP 도구(`search_requirements`, `get_requirement`)로 동일한 검색 코어를 사용하는 구조를 구상한다. **로컬 MCP는 로컬 검색 도구이지 로컬 추론 엔진이 아니다.** 연결된 모델에 도구 출력이 전달될 수 있으므로 사내 승인된 에이전트·계약 및 접근 범위를 준수해야 한다.

또한 파트 내 업무에 한정하더라도 Vercel Hobby를 업무용 호스팅으로 사용 가능한 것으로 가정하지 않는다. 과제 배포는 학술·비상업적 데모 전용이다.

## Handoff to Codex

먼저 **[AGENTS.md](AGENTS.md)**와 **[PRD.md](PRD.md)**를 읽고, 진행 상태와 소유권은 **[PLAN.md](PLAN.md)**의 체크리스트와 실행 로그를 따른다. 우선순위는 **동작하는 배포 > 정확한 검색 > 근거 확인 > LLM 답변 > 시각적 장식**이다. 완료되지 않은 기능·테스트·배포는 명시한다.

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [MiniSearch](https://github.com/lucaong/minisearch)
- [OpenRouter API](https://openrouter.ai/docs)
- [OpenRouter free models](https://openrouter.ai/models?max_price=0)
- [Vercel monorepos](https://vercel.com/docs/monorepos)
- [Model Context Protocol](https://modelcontextprotocol.io/)
