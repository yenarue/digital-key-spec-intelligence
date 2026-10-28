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
- Model deadline is 90 seconds including response body; Route Handler `maxDuration=120` gives retrieval/validation overhead room. Total generation budget is 8,000 tokens including reasoning; still one free-model call, no automatic retries or paid fallback.
- Local verification: unit/integration168/168, browser7/7, lint/build passed. All three UI sample questions returned actual AI answers locally with validated exact citations.
- Production homepage returned HTTP200, full product title, synthetic notice and `v0.1.1`. Actual POST asking whether V2 entry-only permits starting returned HTTP200 / `answered`, no warnings, V2-only evidence and the correct `DEMO-V2-REQ-012` citation; answer was manually checked against its source.
- This supersedes the earlier missing Production-answer/version checks. Q5 and the remaining live browser/mobile/console/function-log checks are still pending. Free-model availability and answer quality are not guaranteed by one successful request.
