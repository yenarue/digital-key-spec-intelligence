# Implementation decision log

## 2026-10-29 — Web design direction confirmed
- User selected A, Clear Desk: light surfaces, restrained blue actions, side-by-side answer/evidence on desktop and a single column on mobile. B/C remain comparison records only.
- Use Pretendard for Korean/English UI and source prose; retain monospace for requirement/citation IDs. The standalone preview uses a version-pinned CDN; the future Web app will self-host official WOFF2 with its copyright/license notice and system fallback.
- Defer navigation pattern selection until real additional screens require menus. Keep header and content separate for future expansion; do not add empty navigation, fake routes, or change the A–E scope. Local MCP remains disabled.

## 2026-10-29 — Initial decisions
- Name: Digital Key Spec Intelligence (DKSI).
- Repository starts public and contains synthetic fictional examples only.
- A–E: Next.js + MiniSearch lexical retrieval + server-side OpenRouter free LLM + Vercel academic demo.
- F: Local MCP deferred; disabled menu teaser only. Shared core architecture preserved.
- No paid API requirement; offline search fallback mandatory.
- No real standards or company data, PDF upload or vector index in MVP.
- The initial commit is a planning/scaffold, not a runnable deployed application.

## 2026-10-29 — Operational model clarification
- **Company deployment:** local stdio MCP for indexing and retrieval of appropriately authorized CCC 3.1.4/4.1.0 PDFs; reasoning happens in employer-approved Codex, Claude, or Gemini clients under company agreements. No Ollama requirement.
- **Course deployment:** Vercel public demo uses independent fictional Digital Key-style requirements (16 in V1 and 16 in V2) and OpenRouter free-model grounded answers. Do not copy/rephrase actual CCC requirement text into public fixtures.
- Private GitHub reduces visibility but does not grant a right to distribute documents. Review each PDF's notice and applicable terms before any third-party upload.
- External OpenRouter mode with real CCC text is a separately permission-gated optional future capability; do not auto-send real PDF content.

## 2026-10-29 — Skill scope decision
- Course-facing agent workflow is separate from the Vercel RAG Web runtime.
- Added `.agents/skills/spec-requirement-navigator/SKILL.md` and `.agents/skills/spec-answer-auditor/SKILL.md` with focused activation triggers and grounded evidence checks.
- Future `spec-version-diff`, test case, impact-analysis and knowledge-curation Skills are ideas, not implemented features.
- Skills can use synthetic JSON immediately in Codex; Local MCP integration is still Stage F. Live Codex triggering and quality are not yet validated.
- Full proposal and demo script: [docs/skills-plan.md](skills-plan.md).

## 2026-10-29 — Live Skill example records
- Keep usage instructions in each Skill's README and preserve the actual user question and final answer in a separate `example.md`, linked from that README. Preserve the original answer rather than silently incorporating later audit corrections; only convert local file links to repository-relative links.
- Recorded one explicit Navigator invocation for synthetic V2 UWB/NFC fallback, followed by one explicit Auditor invocation against that answer in the same Codex conversation. Both used local JSON; no MCP, MiniSearch, or external API was used for retrieval.
- The audit checked six existing V2 citation IDs and exact quotes, inspected referenced requirements, and distinguished directly supported claims from interpretation of absent automatic-transition guarantees. This is not a separate-agent review or completion of the full regression suite. No A–E scope change.

## 2026-10-29 — Implementation contracts and execution
- Node 24/npm workspaces, Next.js 16.4.3 App Router, MiniSearch 7.2.0, Vitest 5.0.5. Build uses webpack to keep workspace JSON/font bundling predictable; package-lock records the installed dependency tree.
- Main owns shared contracts, package/config/lock files and runtime composition. Three agents own Core, Frontend and API respectively. PG1 integrates search-only before PG2 introduces real-model answers.
- Query length is trimmed Unicode code points; default topK=5, allowed 1–8. Omitted versions means both; an empty/unknown version list is invalid. Request body is limited to 8 KiB.
- Evidence keeps full fictional requirement text as the exact quote. The model supplies a structured candidate, while the retriever generates source IDs; an invalid citation withholds the entire answer and preserves search sources.
- A standalone preview is a design artifact only. The application uses real POST /api/ask and never fixed demo answers as a runtime fallback.
- Existing Vercel CLI token was rejected during G0; authentication choice requested. No successful deployment or actual OpenRouter completion is implied by automated tests.
- The live dev server uses `.next-dev` (`DKSI_DEV=1`) and production uses `.next`; this permits real-time user preview during build/E2E verification. Framework-generated agent rules are disabled so repository instructions remain explicit.
- Browser E2E uses the installed Chrome channel and a production server on port 3100 with the optional OpenRouter key explicitly blank. These tests verify deterministic search fallback; real OpenRouter verification is separately reported.

## 2026-10-29 — Integration and independent review
- G1 local Vertical Slice and G2 real-validator integration passed. Three independent reviewers checked security, architecture and test gaps; no unresolved material defect was found in their reviewed scope.
- A browser regression exposed Next internal hostname normalization: Origin is now checked against public Host plus forwarded HTTP/HTTPS scheme instead of internal request.url alone. Added localhost/public HTTPS/cross-origin regressions and reran browser tests.
- Added actual core+provider-parser+validator integration tests; runtime with a forbidden paid model fails before network and preserves sources. Browser answered/HTML-escaping/citation-focus verification uses an explicit stub, not a real model.
- Local validation: 163 Vitest tests, 18 eval cases (17/17 expected IDs@5), 7 browser tests, lint/typecheck/build passed. Production dependency audit reported zero vulnerabilities. No actual model success/live deployment is claimed without key/authentication.
- P1 examples and bilingual synonyms were inexpensive and implemented. A full screen-reader/IME/320px/200% accessibility audit and CI expansion are deferred; basic 375/1280px reading and controls were browser-tested.

## 2026-10-29 — Product name and Web release version
- Use the full product name, Digital Key Spec Intelligence, in the header and browser title. Keep the DKSI wordmark.
- Web release version is a separate concern from fictional spec V1/V2. Display Web vX.Y.Z above the signature footer, read from apps/web/package.json.
- Use Major for incompatible contracts/workflows, Minor for compatible feature additions, Patch for fixes/UI/copy; increase per subsequent release, not per commit. Initial unshipped implementation remains 0.1.0. Full policy: docs/versioning.md.

## 2026-10-29 — Root env and actual free-model verification
- User-provided repository-root .env is loaded only at Next configuration time with Node24 loadEnvFile. Existing process/app environment values take precedence, including the blank test key. No secret value was printed or added to Git/Vercel uploads.
- Actual local server API trial: a V2 entry-only query with topK1 returned answered in2508ms and cited exactly REQ012; manual check confirmed the explicit prohibition. Two other bounded trials were withheld for citation validation/timeout. Keep free-router failure fallback and no automatic retry; one real success is not a reliability guarantee.
- Removed the visible Web prefix: show v0.1.0 above the signature footer. Root dotenv support is a local configuration improvement, not an upload of env files.
- After root-env support, 163 tests/lint/build and 7 E2E passed; explicitly blank test environment key stays blank. Actual credential scan across 45 client bundle files passed without printing its value.


## 2026-10-29 — Explicit keyword/AI search modes (v0.2.0 follow-up)
- After first Production and core live QA, implement user-approved FR-18/19 as a compatible feature release. Main owns shared contract and integration; two agents exclusively own API and UI files. Keep MiniSearch/Core and the response statuses/evidence unchanged.
- UI defaults to keyword and submits mode explicitly. Optional API mode defaults to ai to preserve existing clients. Invalid mode rejects before retrieval. Keyword returns search_only with no warnings and no provider/validator invocation regardless of key/model configuration.
- Switching modes never submits. Keep only the current normalized question/version/topK's latest response per mode in React memory; label reused results and request snapshot. Input/version changes clear both slots; explicit resubmit always requests again. No persistence, automatic retries or new provider.
- This supersedes DESIGN's older keep-stale-results-on-input-edit rule for this feature. AI and keyword use identical source ranking; AI only enables generation from the same evidence.
