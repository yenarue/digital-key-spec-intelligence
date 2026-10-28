# Digital Key Spec Intelligence (DKSI)

> **Evidence-first Requirement Assistant** — Find the requirement. Show the evidence. State the uncertainty.

KAIST ITM.690 2026-10-29 발표를 위한 공개 합성 데이터 데모와 **실제 CCC V3.1.4/V4.1.0 PDF를 사용하는 후속 로컬 RAG**를 공통 코어로 연결하는 프로젝트. 구체적 설계: [CCC PDF RAG architecture](docs/ccc-rag-architecture.md). 실제 디지털키 개발에서 겪는 문서 검색·조건 해석·버전 혼동·근거 부재·지식 파편화 문제를 출발점으로 한다.

**상태:** 초기 저장소/설계 문서만 준비됨. **웹앱·RAG·Vercel 배포는 아직 구현되지 않음.**

> **Public repository safety:** 실제 CCC 사양 원문(배포 권한을 확인하지 않은 자료 포함), OEM/사내 문서, 소스·로그, 키·고객/개인정보를 절대 추가하지 않는다. `data/demo`에는 실제 표준과 무관한 **Synthetic/Fictional** 자료만 보관한다.

## Scope: now vs. later

| 단계 | 구현 목표 | 상태 |
| --- | --- | --- |
| **A** | 합성 규격 2개 버전(V1/V2)과 Requirement ID | 샘플 데이터 제공 |
| **B** | MiniSearch 기반 요구사항 검색, 버전 필터 | 구현 예정 |
| **C** | 정확한 문서·버전·Section·ID·원문 근거 카드 | 구현 예정 |
| **D** | 서버 측 OpenRouter 무료 모델 답변 + 실패 시 검색 폴백 | 구현 예정 |
| **E** | Next.js Web MVP를 Vercel에 배포 | 구현 예정 |
| **F** | 공통 검색 코어를 사용하는 **Local MCP** | 다음 단계 (웹 메뉴만 disabled / Coming soon) |

**이번 발표 A–E:** 합성 데이터 Web RAG와 Vercel 배포. **후속 로컬 실증:** 사용자가 보유한 CCC PDF 두 개를 `data/local/ccc/`에서 로컬 파싱·색인하고 Ollama 로컬 추론으로 답변 생성. 외부 OpenRouter에 실제 스펙 발췌를 보내는 기능은 별도 권한 확인·명시적 허용 이후에만 활성화. MCP는 이후 F 단계.

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

## Planned repository layout

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

실제 Next.js 소스·npm 의존성·lockfile은 Codex가 A–E 구현 시 추가한다.

## Getting started (after implementation)

Node.js LTS, npm 필요. 현재 아래 명령은 **완성 목표에 대한 실행 계약**이며, 앱 구현 전에는 `npm run dev`가 동작하지 않는다.

```bash
npm install
cp .env.example apps/web/.env.local
# apps/web/.env.local에 OPENROUTER_API_KEY 설정 (선택)
npm run dev
npm run test
npm run lint
npm run build
```

- `OPENROUTER_API_KEY`: 서버에서만 사용, 미설정 시 검색 전용 모드.
- `OPENROUTER_MODEL`: 기본 `openrouter/free`; 무료 모델 가용성/호출 한도는 변동 가능.
- 모델과 API 키 설정은 Vercel 서버 환경변수에만 입력한다. `NEXT_PUBLIC_` 접두사 사용 금지.
- Vercel에서는 `apps/web`을 Root Directory로 선택하고, npm workspaces 경로 해석·빌드를 검증한다.
- **배포 URL:** 미배포.

## MVP demo flow

1. `Synthetic demo — not an official specification` 경고를 확인한다.
2. 질문을 입력하고 V1/V2 버전을 선택한다.
3. 상위 Requirement와 문서명/버전/Section/ID/정확한 원문을 확인한다.
4. 무료 LLM이 가능하면 근거를 기반으로 답변을 생성하고 인용을 검증한다.
5. 근거가 없거나 LLM이 실패해도 안전한 결과/폴백이 표시된다.
6. 내비게이션의 **Local MCP — Coming soon**은 dim + disabled 상태다.

## Local MCP vision (not MVP)

팀원이 각자 승인된 로컬 문서를 색인하고, Claude Code/Codex의 MCP 도구(`search_requirements`, `get_requirement`)로 동일한 검색 코어를 사용하는 구조를 구상한다. **로컬 MCP가 곧 데이터의 완전한 로컬 처리를 보장하지는 않는다.** 연결된 모델에 도구 출력이 전달될 수 있으므로 사내 사용 전 보안/AI 정책 검토가 필요하다.

또한 파트 내 업무에 한정하더라도 Vercel Hobby를 업무용 호스팅으로 사용 가능한 것으로 가정하지 않는다. 과제 배포는 학술·비상업적 데모 전용이다.

## Handoff to Codex

먼저 **[AGENTS.md](AGENTS.md)**와 **[PRD.md](PRD.md)**를 읽고, P0 기능을 A→B→C→D→E 순서로 구현한다. 우선순위는 **동작하는 배포 > 정확한 검색 > 근거 확인 > LLM 답변 > 시각적 장식**이다. 완료되지 않은 기능·테스트·배포는 명시한다.

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [MiniSearch](https://github.com/lucaong/minisearch)
- [OpenRouter API](https://openrouter.ai/docs)
- [OpenRouter free models](https://openrouter.ai/models?max_price=0)
- [Vercel monorepos](https://vercel.com/docs/monorepos)
- [Model Context Protocol](https://modelcontextprotocol.io/)
