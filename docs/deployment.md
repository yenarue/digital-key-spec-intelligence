# Vercel academic deployment

This public deployment uses only the independently authored files in `data/demo`. It never loads `data/local`, PDFs, Skills, user uploads, or company data. Use a personal noncommercial coursework project.

## Prerequisites

- Node 24.x and npm 11+; repository-root `npm ci`.
- Vercel CLI authentication (`vercel whoami`). The existing token was rejected during implementation; no successful deployment is recorded yet.
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
