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

## 2026-10-29 — Web copy pass and planned matched-term display
- Replaced the top synthetic-demo banner with a `DEMO` tag whose hover/focus tooltip explains why the corpus is fictional (rights to publish real spec text are unverified). The text `Synthetic demo — not an official specification` remains in the tooltip. This deviates from FR-13's "prominent" wording on purpose; the tag is always visible but the full notice is on demand. Tests hover the tag first.
- Removed the user-facing term "합성 문서" (unclear to non-specialists); use plainer wording such as 데모용 가상 문서 near the input and 스펙 문서 elsewhere. Added a collapsible "이 서비스는 무엇인가요?" intro (`<details>`) instead of a separate about page. Example questions grew from 3 to 9, so FR-15's minimum still holds.
- Moved Web UI copy to `apps/web/src/content/ui-text.json` so the owner can edit it directly (labels, tooltip, intro, examples, loading/error text). Server `warnings` and the LLM prompt stay in code on purpose.
- Decided against showing the full keyword list used for search (query tokens plus synonym expansion look noisy and undermine trust). Planned instead FR-20: per-card matched terms with highlighting. Not implemented yet.


## 2026-10-29 — Fictional overview sections for basic questions
- Basic questions such as "디지털키가 뭐야?" returned no evidence because the corpus held only detailed rules (2.1.1+). Added fictional section 1 to both versions: `OVR-001` Purpose and Scope, `OVR-002` Feature Summary, `OVR-003` Terms, plus V2-only `DEMO-V2-OVR-004` Changes from V1. Text is independently written and summarizes only the demo requirements; no CCC text.
- Did not let the LLM answer from general knowledge when evidence is missing; grounding rules stay unchanged.
- New IDs use `OVR` so existing `REQ` IDs and citations are stable. Overview entries are appended to the requirements array because tests reference requirements by array position.
- Added synonym groups: 디지털키/디지털/digital/dk, 기능/feature(s), 용어/개요/overview/terms/definition, 변경/차이/비교/changes/differences. Added eval cases Q11–Q13 and a first example question.
- Known trade-off: Q1–Q10 keep their expected requirement at rank 1, but overview entries (mostly `OVR-002`, a broad summary) now appear at ranks 2–5 for some detailed questions and may be sent to the LLM as extra evidence.

## 2026-10-29 — Matched-term chips and highlights (FR-20)
- `Evidence.matches` is optional and additive: `{term, fields, viaSynonym, ranges}`. Core fills it from MiniSearch `match`; `viaSynonym` comes from a second search with the unexpanded question, so ranking is untouched. Ranges are computed in Core with the same tokenizer, so the UI only slices text and never rebuilds it.
- Direct ID lookups and `getRequirement` carry no matches. The LLM prompt still sends a fixed field list, so matches never reach the model. The client response guard does not require matches; the card ignores malformed terms/ranges.
- Removed overview keywords `디지털 키` and `digital key` (replaced by `digital`): MiniSearch splits keyword phrases, so `키`/`key` pulled overview cards into unrelated questions.

## 2026-10-29 — Browser-local question history (FR-21, planned)
- Users want to revisit past questions. With no login, store history only in the browser's localStorage; no server DB, no query logging/analytics. Narrowed PRD scope and AGENTS rule 6 from "persistence" to "server-side persistence" accordingly. Collecting all users' queries is out of scope (server persistence, risk of pasted internal text).
- Opening an entry shows the saved snapshot without a new request; `다시 실행` resubmits explicitly. Snapshots store the Web app version; a mismatch shows a re-run hint instead of checking IDs against the corpus on the client.
- UI: chose C (collapsible list below the form, collapsed by default, latest 5, no "more" yet). Recorded B (header button + drawer/bottom sheet) as the fallback if C feels awkward in use; A (left sidebar) rejected for now per the deferred-menu principle.
- Priority raised from P2 to P1 by the user on the same day.
- Moved design previews into `docs/design-previews/` (`main-screen-layouts.html`, formerly root `design-preview.html`; new `question-history.html`) and excluded the folder from Vercel uploads. Not implemented yet.

## 2026-10-29 — Fuller AI answers and larger model budget
- Answers felt too short because the prompt said "간결하게". The prompt now asks for a 1–2 sentence conclusion, then "- " items for multiple conditions/exceptions or version comparisons, Korean obligation wording for SHALL/SHOULD/MAY, a one-line note when interpretation goes beyond the text, and no mistranslation of spec terms (passive entry ≠ 수동 진입). A fixed section template was tried first and dropped: the free reasoning model spent the whole token budget deliberating (finish_reason=length), even at 4,000 tokens for "디지털키가 뭐야?".
- Raised the shared reasoning+output budget 2,400→8,000 tokens (≈55–60s at the observed rate, inside the 90s deadline; zero cost on free models, and most answers stop well before the cap), model deadline 60→90s and route maxDuration 90→120s (within Vercel Hobby's 300s). Still one free-model call, no retries. Trade-off: a runaway-reasoning failure now takes longer before falling back to evidence. `reasoning.effort: low` was ignored by the configured Nemotron free model.
- Live trials were small (a handful of calls before a 429); the owner then raised the OpenRouter daily limit and judged answer quality improved. Not a reliability measurement.

## 2026-10-29 — Agent Skills landing page (FR-22, P1)
- The presentation needs to show that the project standardizes spec search and verification, not just a RAG chatbot. Added a static `/skills` landing page that leads with the core message (Web app = service interface, Agent Skills = developer-workflow interface) and introduces the two repo-local Skills plus a Web RAG → Agent Skills → Local MCP roadmap. Raised from P2 to P1 by the user because it is shown in the same-day presentation.
- The page only describes Skills: no run button, no Skill/API/LLM call, no MCP page. It states that Skills are not executed by the web app and claims only recorded verification (one explicit manual Codex run per Skill). The client is described as "Codex 등 호환 에이전트" rather than "Codex CLI only"; Claude Code discovers the same files via `.claude/skills` but has no recorded run yet. GitHub links drop the `utm_source` parameter from the drafted copy.
- Menu became a top bar with three items (DESIGN §6); `Local MCP · Coming soon` stays a disabled button. The landing page may use a larger hero than the search screen. Implemented directly by Main instead of a Frontend subagent because of the same-day schedule, avoiding files touched by the parallel FR-21 work.
- Follow-up: the page also shows the six-Skill plan from `docs/skills-plan.md` (2 implemented, 4 planned) with the design goal and why Navigator/Auditor came first: the other Skills all consume found evidence and verified interpretations. Placed before the Skill cards so the flow reads plan → implemented Skills.
- Follow-up: the hero's 다체 core message read out of place next to the site's 해요체, so the user picked candidate C (title “누가 어떤 AI로 물어도, 같은 근거로 답하도록”, message kept in the lead). The roadmap gained a goal line, per-stage 문제/해소 and a small architecture strip; Skill→MCP paths are dashed because Skills read the JSON directly today. Shipped as Patch v0.3.1 (copy/UI only).
- Follow-up (v0.3.4): the separate “먼저 구현한 2개 Skill” section became a popup opened from the two implemented Skill plan cards (native `<dialog>`; detail-only buttons, no execution). It shows a Navigator ─답변→ Auditor switch, a flow diagram plus the step text (user kept both), and a verbatim excerpt of each example.md as chat bubbles; excerpts were string-checked against example.md and `spec-v2.json`.
- Follow-up (v0.3.4): roadmap adds **Spec Wiki (LLM Wiki)** as planned step 3 before Local MCP. In the strip the wiki is its own column between 원문 스펙 and 공통 코어 because it is a stored artifact built offline (Ingest) and checked (Lint, the Auditor role); Query stays in the shared core because Web RAG and MCP both run it per question. The wiki is interpretation layered on the source: every statement links to Requirement IDs, answers still cite the original requirement, and a wiki built from real CCC text stays in the approved local environment like the source. Nothing is implemented yet; the caption states that today the core reads the synthetic JSON directly.

## 2026-10-29 — Browser-local question history (FR-21) implemented
- Storage key `dksi.history.v1`, newest 5; a repeat of the same normalized question+mode+versions replaces the older entry. Entries are re-validated on every read with the client response guard (`isAskResponse`, now exported) and dropped if malformed; nothing is repaired or sent anywhere.
- React reads history through a `useSyncExternalStore` adapter so server render and hydration see an empty list; a mount-time `setState` effect was rejected by the `react-hooks/set-state-in-effect` lint rule.
- Opening an entry restores question/version/mode and puts the saved response into that mode's FR-19 slot (other slot cleared), labelled `저장된 결과` with `다시 실행`; re-run is a normal submit. Old app version → re-run hint. History E2E lives in `e2e/history.spec.ts` to stay apart from concurrent FR-22 edits to `ask.spec.ts`.

## 2026-10-29 — Search area and history list follow the C design preview
- The search form is now one white card (toggles, question box, example chips), as in `docs/design-previews/question-history.html` C. Kept the existing segmented toggles at the owner's request, only shortened to 32px. Kept two small notes the preview omits on purpose: the mode hint (keyword makes no AI call) and the "demo fictional documents only" input hint. The `질문` label is visually hidden but still names the textarea.
- History rows are single lines: question (ellipsis) then short tags (`AI`/`키워드`, `전체`/`V2`, result) and time (HH:mm today, M/D otherwise). Per-row delete stays (DESIGN rule) but shows on hover/focus, always on touch. Opening an entry collapses the list and marks that row current; the saved banner gains a border, `↻ 다시 실행` and the old-version note.


## 2026-10-29 — Search modes integration and concurrent release closure
- Keyword/AI modes were implemented by two disjoint API/UI agents and integrated by Main with real core/provider/validator tests. A third read-only agent checked Production; API/UI agents independently cross-reviewed each other. Zero keyword provider calls and omitted-mode compatibility are asserted server-side.
- Clean v0.2.0 checkout and Preview passed. During continuation, main had advanced to v0.3.3; preserve all concurrent authorized work and verify the latest Production rather than uploading an obsolete checkout. Latest215 unit/integration,21 evaluation,16 browser tests, lint/build and actual live mode/citation/mobile checks passed; see deployment.md.
- Initial no-key Preview proof and final blank-key E2E/Production mobile checks jointly cover the initial vertical slice; no separate rerun of no-key Preview mobile was claimed. Provider fault cases are controlled tests; actual successful model answers are recorded separately. Full assistive-tech/Skill activation/CI work stays deferred.

## 2026-10-29 — One tabbed card per requirement across versions
- Search results that contain the same requirement in V1 and V2 now render as one card with V1 | V2 tabs (default: latest version) instead of two cards. Grouping is UI-only: the `Evidence` contract and ranking are unchanged. The key is `documentId + sectionId + requirementId with the version token removed` (e.g. `DEMO-V1-REQ-004` and `DEMO-V2-REQ-004` share a key); a requirement present in only one version stays a plain card, and two items of the same version are never merged.
- Card numbers and AI citation labels (`근거 N`, `근거 N · V1`) now count cards, not raw sources. A citation to a version in an inactive tab opens that tab, then focuses the card. Every version panel stays in the DOM (hidden) so citation anchors still resolve.
- Optional "바뀐 부분 강조" shows the full text of the active version with word-level differences against the other version. In this view search-term highlights are not drawn, because the two highlightings would overlap. Source text is never altered. The source-count badge still shows the number of evidence items, which can be larger than the number of cards.
