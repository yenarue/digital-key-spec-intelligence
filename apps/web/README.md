# Web App (A–E MVP)

Next.js App Router + TypeScript + Tailwind. A안 Clear Desk, local Pretendard WOFF2와 license를 사용한다. 실제 `POST /api/ask`가 shared core 검색을 호출하며 키 미설정 시 검색 전용으로 동작한다.

저장소 루트에서 `npm ci`, `npm run dev` 후 http://localhost:3000 을 연다. 선택적 키는 저장소 루트 `.env` 또는 이 디렉터리의 `.env.local`에 두고 절대 커밋하지 않는다. Next 설정 로딩 시 루트 `.env`를 보충하며 기존 process 환경변수와 앱 설정이 우선한다. `OPENROUTER_API_KEY`는 서버 전용, `OPENROUTER_MODEL` 기본은 `openrouter/free`다.

- `src/contracts`: client/server wire types
- `src/server/corpus.ts`, `ask-runtime.ts`: Main이 관리하는 synthetic-only 조립점
- `src/server/llm`: 무료 모델·1회 호출·최대60초 timeout (Route90초)·64KiB 응답/2,400 총 생성 token 제한 (reasoning 포함)
- `src/components`, `src/client`: 안전한 text/인용 렌더링·버전·원문 확장·중복 전송 방지
- `src/integration`, `e2e`: 실제 코어 연결 및 결정적인 브라우저 회귀

무근거는 insufficient_evidence, 키 없음은 search_only, 모델 오류/인용 검증 실패는 llm_unavailable과 검색 sources를 반환한다. same-origin 검사는 인증이나 전역 rate limit이 아니다. Local MCP는 disabled/aria-disabled이고 별도 서버/페이지는 없다.

Vercel 인증·실제 URL 확인은 아직 미완료다. 실모델 결과는 PLAN 실행 로그를 확인한다. [배포 가이드](../../docs/deployment.md)와 [PLAN](../../PLAN.md)을 확인한다. Skill 파일은 Web에서 실행하지 않는다.

Vercel의 90초 함수 예산은 Fluid Compute 환경을 기준으로 한다. [공식 duration 문서](https://vercel.com/docs/functions/configuring-functions/duration)의 현재 Hobby 한도 내이며 실제 프로젝트 설정과 배포 URL에서 확인해야 한다.
