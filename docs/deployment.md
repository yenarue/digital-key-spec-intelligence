# Vercel academic deployment

This public deployment uses only the independently authored files in `data/demo`. It never loads `data/local`, PDFs, Skills, user uploads, or company data. Use a personal noncommercial coursework project.

## Prerequisites

- Node 24.x and npm 11+; repository-root `npm ci`.
- Vercel CLI authentication (`vercel whoami`). See [Deployment record](#deployment-record) for the first successful deployment.
- Optional OpenRouter free-model key: locally use the repository-root `.env` or `apps/web/.env.local`; existing process/app variables take priority. Never use chat, tracked files or CLI arguments. Vercel needs its own server environment settings; local `.env` is not uploaded.

## Local verification

```sh
npm ci
npm run test
npm run eval
npm run lint
npm run build
npm run test:e2e
npm run dev
```

The browser test command runs a production server on 127.0.0.1:3100 and uses installed Google Chrome. `npm run dev` serves http://localhost:3000 using `.next-dev`; production builds use `.next` so the live development screen remains available.

## Connect the Vercel project

1. Authenticate with `vercel login` and verify with `vercel whoami`. If CLI authentication is unavailable, import this Git repository in the Vercel dashboard.
2. Select Next.js, Root Directory **apps/web**, Node **24.x**. Enable access to files outside the root directory so the root lockfile, workspace package and `data/demo` can be built. Keep the default Next.js output configuration.
3. Install using the root npm workspace/lockfile (`npm ci` from the repository root if an override is needed). Build from `apps/web` using `npm run build` (its script is `next build --webpack`). Do not deploy only the `apps/web` directory without its workspace and synthetic data.
4. Create an initial Preview with no key. Verify real search and exact source fields before enabling model answers.
5. In Preview and Production server environments, optionally set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL=openrouter/free`. Never use `NEXT_PUBLIC_`. Only supported free identifiers may be used; there is no paid fallback. Redeploy after changing variables.
6. Once CLI is linked to this configured project, run `vercel deploy` for Preview and `vercel deploy --prod` for Production from the repository root. Do not upload a shared working directory while agents are modifying it: freeze the source or deploy a fixed Git revision/isolated checkout.

If account/project selection, a paid upgrade, or new permissions are required, resolve that choice with the user. Do not enable a paid service to bypass a free-model or hosting restriction.

## Verify the actual final URL

- Homepage shows Digital Key Spec Intelligence in the header/browser title, the synthetic disclaimer, correct font and disabled Local MCP item on desktop/mobile.
- `vX.Y.Z` above the signature footer matches `apps/web/package.json`; follow [versioning policy](versioning.md) for subsequent releases.
- Q1 with V1, Q3 with V2, Q5 with both: expected evidence in top five; no wrong-version results under a single-version filter.
- Every quote/fullText matches the committed fictional requirement; expansion and citation navigation work.
- Unknown spaceship question: `insufficient_evidence`, null answer and empty sources.
- Invalid input: safe 400/413. No key: usable `search_only` evidence.
- With key: one actual grounded Korean answer, checked against source conditions/exceptions. Provider errors preserve search hits. Do not call a mock success an actual model verification.
- Check browser console and deployment/function logs without logging keys, user questions, prompts or raw upstream responses.
- Record URL, revision/source snapshot, date and actual results in README/PLAN. If authentication/model availability still prevents a step, leave that acceptance item incomplete.

## Runtime limits and known boundaries

One model request per valid question, bounded input/context/output/time, no automatic retry or paid fallback. Same-origin browser checks are not authentication and do not provide a distributed global rate limit. Remove the optional server key to retain search-only operation if public free-model quota is exhausted. No database or persistent user query log is added.

## Deployment record

### 2026-10-29 — first Production (Claude Code session)

- URL: https://digital-key-spec-intelligence.vercel.app (Vercel project `yena-kim1/digital-key-spec-intelligence`, Git-connected to `main`; pushes to `main` now auto-deploy Production).
- Source: clean detached worktree of `6b4a3de`, deployed with `vercel deploy --prod`. An earlier Production build from the shared working directory (`6b4a3de` + uncommitted agent edits, `gitDirty=1`) was superseded by this one.
- Project settings (stored in Vercel, no `vercel.json`): Root Directory `apps/web`, Framework Next.js, Node 24.x, files outside root directory enabled, Install Command `cd ../.. && npm ci`. The default install only installed `apps/web` dependencies, so root `typescript`/`@types/*` were missing and `next build` failed.
- Environment (Production + Preview, Sensitive): `OPENROUTER_MODEL=openrouter/free`; `OPENROUTER_API_KEY` entered by the owner in the dashboard (Type "Secret").
- Local before deploy (working tree at `f4e25b9`, not re-run on `6b4a3de`): `npm run test` 163/163 passed, `npm run lint` clean, `npm run build` passed. `npm run eval` and `npm run test:e2e` were not run.

Actual results:

| Check | Preview (no key) | Preview (key) | Production |
| --- | --- | --- | --- |
| Homepage title, synthetic disclaimer, `Coming soon` MCP item (HTML only) | ✓ | — | ✓ |
| Q1 (V1) top hit `DEMO-V1-REQ-001`, V1 only | ✓ `search_only` | ✓ `answered`, cites `DEMO-V1-REQ-001`, matches source | ✓ hits; `llm_unavailable` (timeout) |
| Q3 (V2) top hit `DEMO-V2-REQ-004`, V2 only | ✓ `search_only` | — | ✓ hits; `llm_unavailable` (unverifiable citation, then timeout) |
| Unknown spaceship question → `insufficient_evidence`, no sources | ✓ | — | ✓ |
| Empty question → 400 | ✓ | — | ✓ |

Not yet verified: a grounded `answered` response on Production (free-model timeouts), Q5, mobile layout, version label, full-text expansion/citation navigation in a browser, browser console and function logs.

### 2026-10-29 — v0.1.1 timeout patch

- Source: `0eb5af2` (fix `617fc2e`), pushed to `main`; Git-triggered Production deployment `dpl_Dap8KZSSqmKSMT1HcDQX2VS1M48H` verified Ready using `vercel inspect`.
- At this v0.1.1 revision, model deadline was60 seconds including response body, Route Handler maxDuration90, and total generation budget2,400 tokens including reasoning. Later commit34fb076 increased these to90/120 seconds and8,000 tokens; that later change is not part of the original v0.1.1 verification. Still one free-model call, no automatic retries or paid fallback.
- Local verification: unit/integration168/168, browser7/7, lint/build passed. All three UI sample questions returned actual AI answers locally with validated exact citations.
- Production homepage returned HTTP200, full product title, synthetic notice and `v0.1.1`. Actual POST asking whether V2 entry-only permits starting returned HTTP200 / `answered`, no warnings, V2-only evidence and the correct `DEMO-V2-REQ-012` citation; answer was manually checked against its source.
- This supersedes the earlier missing Production-answer/version checks. Q5 and the remaining live browser/mobile/console/function-log checks are still pending. Free-model availability and answer quality are not guaranteed by one successful request.

### 2026-10-29 — v0.3.0 (FR-20, FR-21, FR-22)

- Source: `fbee593` pushed to `main`; Git-triggered Production deployment.
- Local before push: `npm run test` 215/215, lint, typecheck, build passed; `npm run test:e2e` 16/16 (incl. FR-21 history and `/skills`).
- Production: `/skills` returned HTTP 200 about a minute after the push; page HTML showed `v0.3.0`, the not-executed notice, the Skill plan section and `Local MCP · Coming soon`. HTML check only — no live browser/mobile run, and FR-21 history not exercised on Production.


### 2026-10-29 — search modes release and latest v0.3.3 closure

- Search modes commits: becaa91 contract,922b408 API,8b8820d UI,fd0ec72 integration/icon,9abe8e6 v0.2.0 release. Two agents had disjoint API/UI ownership; Main integrated; agents cross-reviewed read-only with no material defect.
- Clean v0.2.0 checkout: npm ci, test198/198, eval18/18, lint/build, E2E9/9 passed. Preview https://digital-key-spec-intelligence-l4i4zr8co-yena-kim1.vercel.app (dpl_FaVNLFxup3YM8jMV39wz2q7vbVS4) Ready; actual keyword Q5 returned search_only/null/empty warnings and both expected008 sources.
- Concurrent work advanced main to0261d61/v0.3.3 before final Production verification. Preserved it; no obsolete v0.2.0 Production upload. Latest public deployment dpl_7EYUAknDCDWPm4LC7VcajZAVvtgT, https://digital-key-spec-intelligence.vercel.app, verified Ready and actual version v0.3.3.
- Re-executed latest local test215/215, eval21/21 (all21 expected IDs@5), lint/build, E2E16/16. Credential scan of23 current client build files passed without printing the key. Dev remains localhost:3000.
- Actual Production API keyword checks Q1V1/Q3V2/Q5all passed expected IDs@5, exact original quotes/fullText and version isolation; unknown question returned insufficient_evidence; invalid mode/empty question400.
- Actual isolated-browser QA: initial0POSTs; keyword submit1POST gives search_only/null/no warnings; AI switch no request; explicit AI submit gives secondPOST/answered with correct V2 entry-only/start REQ012 citation; switching back keyword reuses previous result with no third request. Same5 sources in both modes. One actual AI call for this final QA.
- Mobile375/desktop1280 no horizontal overflow; source citation focus, icon200, browser0errors/0warnings, Skills navigation, version and isolated history records verified. Screenshots: output/playwright/live-033-mobile-ai.png and live-033-desktop-keyword.png.
- A–E core live Gate and FR-18/19 accepted. Keyword zero-provider calls are proven by server/runtime spy tests; live response status alone is not used as model-call telemetry. Retain free-model nondeterminism, full assistive-tech/Skill activation/CI limitations; no reliability or quota-savings percentage claimed. No new secrets/environment/model settings were changed in this closure.

### 2026-10-29 — v0.3.7 longer AI deadline
- Model deadline 90s → 180s; route maxDuration 120s → 210s. Output budget, free-only model policy, citation validation and one-call/no-retry behavior unchanged.
- Executed: `npm run test` (239/239), `npm run eval` (21/21; no version leaks), `npm run lint`, `npm run build`, `git diff --check` — passed. Eval needed execution outside the sandbox because tsx IPC listen was denied. Build's functions-config-manifest records maxDuration210.
- Fake-clock regression accepts a complete valid response at100s; timeout regression confirms sources retained and no citation validator call. This does not reproduce or fix the owner's citation rejection; that remains distinct from timeout.
- Direct `vercel deploy --prod --yes` failed with `Not authorized`; checking the existing Git-connected Production route next. Live deployment is not yet verified.
