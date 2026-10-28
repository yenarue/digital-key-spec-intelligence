# Web App (A–E MVP)

Next.js App Router + TypeScript + Tailwind. A안 Clear Desk, local Pretendard WOFF2와 license를 사용한다. 실제 `POST /api/ask`가 shared core 검색을 호출한다. UI는 키워드 검색이 기본이며, AI 검색을 선택해 제출하면 같은 검색 근거로 답변을 생성한다. 키워드는 키가 있어도 모델을 호출하지 않는다.

저장소 루트에서 `npm ci`, `npm run dev` 후 http://localhost:3000 을 연다. 선택적 키는 저장소 루트 `.env` 또는 이 디렉터리의 `.env.local`에 두고 절대 커밋하지 않는다. Next 설정 로딩 시 루트 `.env`를 보충하며 기존 process 환경변수와 앱 설정이 우선한다. `OPENROUTER_API_KEY`는 서버 전용, `OPENROUTER_MODEL` 기본은 `openrouter/free`다.

- `src/contracts`: client/server wire types
- `src/server/corpus.ts`, `ask-runtime.ts`: Main이 관리하는 synthetic-only 조립점
- `src/server/llm`: 무료 모델·1회 호출·최대90초 timeout (Route120초)·64KiB 응답/8,000 총 생성 token 제한 (reasoning 포함)
- `src/components`, `src/client`: 안전한 text/인용 렌더링·버전·원문 확장·중복 전송 방지
- `src/integration`, `e2e`: 실제 코어 연결 및 결정적인 브라우저 회귀

무근거는 insufficient_evidence, 키 없음은 search_only, 모델 오류/인용 검증 실패는 llm_unavailable과 검색 sources를 반환한다. same-origin 검사는 인증이나 전역 rate limit이 아니다. Local MCP는 disabled/aria-disabled이고 별도 서버/페이지는 없다.

첫 Vercel Production v0.1.1과 실제 AI 응답을 확인했다. 검색 모드 후속 릴리스 v0.2.0의 배포 결과와 실모델 결과는 PLAN 실행 로그를 확인한다. [배포 가이드](../../docs/deployment.md)와 [PLAN](../../PLAN.md)을 확인한다. Skill 파일은 Web에서 실행하지 않는다.

Vercel의 120초 함수 예산은 Fluid Compute 환경을 기준으로 한다. [공식 duration 문서](https://vercel.com/docs/functions/configuring-functions/duration)의 현재 Hobby 한도 내이며 실제 프로젝트 설정과 배포 URL에서 확인해야 한다.

검색 방식 API는 `mode?: "keyword" | "ai"`를 받는다. 생략은 기존 AI 동작을 유지하고 잘못된 값은400이다. 키워드 결과는 `search_only`, null answer, empty warnings다. UI 전환만으로 호출하지 않으며 현재 질문·버전·topK의 모드별 최신 결과 하나씩을 메모리에 보관한다. 질문/버전이 달라지면 비우고, 명시적 재제출은 새 요청을 보낸다.
