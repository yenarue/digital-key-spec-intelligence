# PRD — Digital Key Spec Intelligence

**Product:** Digital Key Spec Intelligence (DKSI)  
**Tagline:** Evidence-first Requirement Assistant  
**Release:** v0.1 academic Web MVP (2026-10-29 class presentation)  
**Status:** A–E Web MVP implemented and deployed; v0.2.0 search-mode follow-up in progress. Actual verification records: docs/deployment.md and PLAN.md.

## 1. Problem and users
Digital Key mobile developers repeatedly search large versioned specifications and OEM/internal requirements. Each developer currently supplies documents to their preferred AI assistant independently. Common problems:
1. Finding a relevant requirement without knowing precise terminology;
2. Interpreting SHALL/SHOULD/MAY, conditions, exceptions and references;
3. Reconciling documents and versions;
4. Hallucinated answers and citations;
5. No shared verified answers.

Primary user: technical mobile Digital Key engineer. **The public demo must not ingest any actual standards text, internal documents, logs or company information**. Synthetic documents are educational fictional content, not a representation of actual CCC requirements.

## 2. Product vision
Find the requirement. Show the evidence. State the uncertainty. Long term, build a reusable team specification intelligence core, with Web and local MCP as separate adapters. In the academic MVP, prove **retrieval and citation traceability** using a small fictional corpus, not enterprise-grade specification interpretation or true cross-document intelligence.

## 3. Milestones and boundaries

**Updated strategy:** Real CCC V3.1.4/V4.1.0 PDFs are the primary domain-validation corpus for the **local RAG pilot**, rather than an afterthought. The Vercel public demo continues to use synthetic data. See [docs/ccc-rag-architecture.md](docs/ccc-rag-architecture.md) for separate **company-approved AI agents via Local MCP** and **academic OpenRouter** processing paths and permission gates.

| Stage | Scope | When |
| --- | --- | --- |
| A | Versioned fictional spec data V1/V2 | MVP |
| B | MiniSearch lexical retrieval, metadata filters | MVP |
| C | Source ID, exact quote, section/version evidence cards | MVP |
| D | Server-side OpenRouter free LLM grounded responses and fallback | MVP |
| E | Next.js deployed to Vercel and tested | MVP |
| F | Local stdio MCP using shared core | Later; disabled UI preview only |
| Future | PDF parsing, semantic+hybrid search, cross-spec relationships, ACL, team knowledge | Not MVP |

No user uploads, real CCC parser, login, external scraping, DB, server-side persistence, actual MCP or enterprise document integrations in the **A–E public demo**. Immediately following the demo, implement **local PDF ingestion + version-aware RAG + Ollama grounded answers**, keeping PDFs and derived indices off GitHub/Vercel; external transfer of real text remains disabled pending legal/organizational authorization.

## Course Skill demonstration (separate from Web runtime)

Two repository-local Skill definitions are maintained at `.agents/skills/`: `spec-requirement-navigator` (question → version-aware requirement search/interpretation with exact evidence) and `spec-answer-auditor` (answer → claim/citation verification). Their demonstrations run in Codex using the committed synthetic corpus; **the deployed Vercel application does not execute these Skills**. When local MCP becomes available in Stage F, retain the same workflow and replace the evidence source with the approved MCP tools. Full plan: [docs/skills-plan.md](docs/skills-plan.md).

**Web introduction page (FR-22, P1):** the Web app may *describe* these Skills on a static `Agent Skills` landing page that leads with the project's core message so the presentation can show the project's two interfaces — the Web RAG app (service interface) and Agent Skills (developer-workflow interface) — and the Local MCP direction that would later connect them. The page explains; it does not execute, call or emulate a Skill. It is a 30–60 second supporting demo, not the centre of the presentation, and must not delay or weaken the Web RAG demonstration.

**Skill acceptance criteria:** relevant questions trigger the Navigator, answer-check requests trigger the Auditor, unrelated requests do not; outputs cite only real demo requirement IDs/quotes, preserve version and qualifiers, and refuse unsupported claims. Record manual Codex validation results. This does not replace the requirement to deploy and demonstrate the Vercel A–E Web app.

## 4. Functional requirements
| ID | Priority | Requirement and acceptance |
| --- | --- | --- |
| FR-01 | P0 | Read two fictional versioned JSON documents, >=8 requirements each, >=2 intentional changes and >=2 condition/exception examples. |
| FR-02 | P0 | Query input supports Korean/English; reject blank and >500 characters. |
| FR-03 | P0 | Top 5 full-text MiniSearch requirement results; rank by relevance, preserve stable source IDs. |
| FR-04 | P0 | Version filter V1/V2/all. No cross-version result leakage. |
| FR-05 | P0 | Every evidence card shows doc title, version, section, requirement ID, exact quote. |
| FR-06 | P0 | Expand card to original full fictional requirement. |
| FR-07 | P0 | Server-only OpenRouter free-model API generates Korean answer based only on retrieved context. |
| FR-08 | P0 | Validate citations against retrieved IDs and verbatim source quotes; never claim semantic certainty from ID verification. |
| FR-09 | P0 | No evidence => `insufficient_evidence`, no fabricated answer. |
| FR-10 | P0 | Missing key/429/error/timeout => `search_only` or `llm_unavailable` and still display evidence. |
| FR-11 | P0 | Deploy and manually verify Vercel live URL. |
| FR-12 | P0 | `Local MCP · Coming soon` is visually dimmed, disabled/aria-disabled, without active link or fake page. |
| FR-13 | P0 | Prominent `Synthetic demo — not an official specification` warning, and never request internal content. |
| FR-14 | P1 | >=5 Korean/English synonym pairs map common natural-language terms. |
| FR-15 | P1 | Three example question actions. |
| FR-16 | P1 | Responsive screen, accessible form/buttons and cards. |
| FR-17 | P1 | Meaningful loading, rate-limit, and fallback labels; prevent duplicate sends. |
| FR-18 | P1 follow-up | User-selectable keyword/AI modes. UI defaults to keyword and explicitly submits mode; keyword uses the identical lexical retrieval but never invokes the LLM, even with a key. Omitted API mode preserves legacy AI behavior; invalid modes return400. |
| FR-19 | P1 follow-up | Switching modes does not submit. Keep at most one latest result per mode for the current question/version/topK in React memory, label reused results and submitted scope/mode, and clear results when question/version changes. No persistence or automatic retries (browser-local question history is the separate FR-21). |
| FR-20 | P2 follow-up (implemented 2026-10-29, not yet deployed; see PLAN §14) | Per-card matched terms. Retrieval returns, for each result, which query terms matched which fields (MiniSearch `match`, currently discarded in `retriever.ts`), exposed as an optional compatible `Evidence` field. Evidence cards show matched-term chips and highlight those terms inside the quote and full text; terms matched only through synonym expansion are labelled as such. Applies to keyword and AI modes. Do not show a global list of the expanded search terms. Highlight only exact substrings of the original text via React elements (no `dangerouslySetInnerHTML`); the original text stays unchanged. Needs spec-core + contract changes, so schedule after the current Codex work and keep core free of Next/browser globals. Acceptance: chips match the corpus terms for known queries; V1-only still never leaks V2; highlighting never alters the verbatim quote; existing tests/e2e pass. |
| FR-21 | P1 follow-up (implemented 2026-10-29, not yet deployed; see PLAN §15) | Browser-local question history. After each submission that returns an API response (any status, including `insufficient_evidence`; not input-validation errors or network failures), save a snapshot to the browser's `localStorage` only: question, mode, versions, topK, submitted time, Web app version, and the full response (status, answer, sources, warnings). Keep the 5 most recent; a repeat of the same question+mode+versions replaces the older entry. UI: collapsible `최근 질문` section below the question form, collapsed by default, showing the count; each row shows the question (one line), mode, version, result summary and time, with per-item delete and clear-all, and the note that history stays only in this browser. No "more" paging for now. Opening a row restores the snapshot without any API call: fills the form with the saved conditions, shows a `저장된 결과` banner (time, mode, version) and an explicit `다시 실행` button. If the snapshot's app version differs from the current one, warn that it was saved by an earlier version and suggest re-running. Never send history to the server, analytics or the LLM. Treat stored data as untrusted: validate it with the existing response guard, drop malformed entries, render as text as today, and keep the page working when storage is unavailable or full. Fallback design if this layout proves awkward: header button + drawer (DESIGN §6). Acceptance: history survives reload and caps at 5; opening a snapshot makes no network request; delete/clear-all work; malformed or blocked storage does not break the page; existing tests/e2e pass. |
| FR-22 | P1 follow-up (raised from P2 on 2026-10-29 for the same-day presentation; see PLAN §16) | Static `Agent Skills` introduction page, designed as a project landing page. It opens with the core message — the project standardizes spec search and verification rather than being just a RAG chatbot; the Web app is the service interface and Agent Skills the developer-workflow interface — written in the site's 해요체 (hero: “누가 어떤 AI로 물어도, 같은 근거로 답하도록”). The roadmap shows the pain point each stage removes and a small architecture strip (원문 스펙 → LLM Wiki → 공통 코어 → 인터페이스) separating what runs today from planned paths. The implemented Skills' detail (role, flow diagram, step text, an excerpt of the recorded example.md question/answer shown as chat bubbles, status, links) opens in a popup from the Skill plan list instead of a separate section. It then contrasts the two interfaces, and links to `Spec Explorer`. Header navigation becomes `Spec Explorer` (`/`, current search screen) · `Agent Skills` (`/skills`, active link) · `Local MCP · Coming soon` (unchanged FR-12 disabled button); the current page is marked with `aria-current="page"`. The page introduces the two repo-local Skills in `.agents/skills/` (`spec-requirement-navigator`, `spec-answer-auditor`): purpose, usage scenario, an invocation example as copyable text (`$skill-name` + one example prompt that the synthetic corpus actually supports), current status, and links to each Skill's GitHub `README.md` and `SKILL.md` (plain `main` URLs, no tracking parameters). It states prominently that **Skills run in compatible agent clients (currently verified in Codex), not inside this web application**, keeps the synthetic-data warning visible, and shows a four-step roadmap — Web RAG (live), Agent Skills (defined, manually verified), Spec Wiki / LLM Wiki (planned: LLM-compiled concept pages linked to Requirement IDs, built by Ingest and checked by Lint; never cited as evidence — answers still cite the original requirement), Local MCP (planned) — that separates what exists today from planned integration. Status text claims only recorded verification (one explicit manual Codex run per Skill; full activation/negative/adversarial checks not yet done). No run/try button, no Skill execution, no API or LLM call, no MCP page or endpoint. Static content only, no new dependency. Acceptance: nav works by keyboard and on 375px; `Local MCP` stays inert; the page makes no network request beyond static assets; links resolve; existing tests/e2e pass. |
| FR-23 | P1 follow-up (implemented 2026-10-29) | `Spec Overview` page ("스펙 한눈에 살펴보기", header menu). (a) **Spec map**: one tile per requirement paired across versions, shaded by word-level change between the oldest and newest version, with `added`/`removed`/`unchanged` states, keyword filter (heading, ID and the data's own `keywords`) and a side-by-side diff on selection. (b) **Scenario simulator**: conditions (version, UWB result, NFC permission, credential state, granted permission) select precomputed results; each applied rule cites the requirement ID of the chosen version. Structure: pairing and diff are computed by `packages/spec-core` from the spec JSON with no AI; the rules are a separate reviewed data file (`data/demo/scenarios.json`) with a review status shown on the page, and are validated against the corpus at build time so a spec swap that breaks a rule fails the build. No AI call, no new API, no persisted data. Rules are synthetic and must not be presented as CCC requirements. Acceptance: pairing keeps every requirement exactly once; validation reports unknown factors, flags and requirements; e2e covers navigation, filter, comparison, every simulator branch and 375/1280px overflow. |

## 5. UX flows
**Default:** select V1/V2/all → enter question → see retrieved sources + grounded answer if AI is available → expand source to confirm verbatim evidence.

**No matches:** communicate that available demo corpus cannot support an answer; do not hallucinate.

**No LLM:** show search hits with an honest banner that free-model AI answer is unavailable.

**Future feature:** dimmed `Local MCP / Coming soon` in navigation is visible but not interactive.

**Post-deployment follow-up:** choose `키워드 검색` (default; evidence only, no model call) or `AI 검색` (same retrieved evidence plus grounded answer), then explicitly submit. Switching between existing results for the same input uses memory without another request. AI failure retains evidence and is labeled separately from intentional keyword search.

**Question history (FR-21, planned):** open the collapsed `최근 질문` section below the form → pick one of the last 5 questions → see the saved result without a new request → press `다시 실행` to search again with the same conditions. History lives only in this browser.

**Agent Skills page (FR-22, planned):** select `Agent Skills` in the header → read what each Skill does, how to invoke it in an agent client, and its current status → follow the GitHub link for the full guide → return via `Spec Explorer`. Nothing on the page runs a Skill.

## 6. Architecture and source model
- `apps/web`: Next.js App Router (TypeScript) and Tailwind CSS. `POST /api/ask` uses Node.js runtime and keeps secrets server-side.
- `packages/spec-core`: independently testable TypeScript document types, MiniSearch index, version and term filters, citation validation.
- `data/demo`: root source of truth. At build time import/copy versioned JSON into package bundle; Vercel runtime is read-only.
- `apps/mcp`: future adapter only.

Document shape:
```json
{
  "documentId": "DKSI-DEMO",
  "title": "Fictional Digital Access Specification",
  "version": "V1",
  "requirements": [{
    "requirementId": "DEMO-V1-REQ-001",
    "sectionId": "3.1.1",
    "heading": "Session Timeout",
    "text": "For this fictional demo, a session SHALL expire after a configured timeout.",
    "keywords": ["timeout", "expiration", "session"],
    "references": []
  }]
}
```
Stable citation: `SRC:DKSI-DEMO:V1:DEMO-V1-REQ-001`. This identifier is generated by the retrieval layer, never invented by the LLM.

MVP search uses lexical full-text retrieval, not vector/semantic embeddings. Index headings, IDs, sections, text and keywords; rank relevant fields. Extend via static Korean-English synonym dictionary without an external search service.

## 7. API and RAG behavior
**POST** `/api/ask`:
```json
{"question":"세션 만료 조건은?", "versions":["V1"], "topK":5, "mode":"keyword"}
```
`mode?: "keyword" | "ai"`; omission defaults to `ai` for compatibility. Keyword with evidence returns `search_only`, `answer:null`, the same sources and empty warnings without invoking generation or citation validation. Neither mode calls a model without evidence. Unknown/empty/null/non-string modes are rejected before retrieval. The response shape remains unchanged. The following is an example successful **AI-mode** response:
```json
{
  "status":"answered",
  "answer":"가상 V1 문서에 따르면 ... [SRC:DKSI-DEMO:V1:DEMO-V1-REQ-001]",
  "sources":[{
    "citationId":"SRC:DKSI-DEMO:V1:DEMO-V1-REQ-001",
    "documentId":"DKSI-DEMO",
    "documentTitle":"Fictional Digital Access Specification",
    "version":"V1",
    "sectionId":"3.1.1",
    "requirementId":"DEMO-V1-REQ-001",
    "quote":"For this fictional demo, a session SHALL expire after a configured timeout.",
    "fullText":"For this fictional demo, a session SHALL expire after a configured timeout."
  }],
  "warnings":[]
}
```
`status`: `answered | insufficient_evidence | search_only | llm_unavailable`. Validate `topK` integer 1–8 and versions against known values, query length 1–500. If evidence exists, pass only the topK source text and IDs to the OpenRouter model. Instruct it to quote/cite only that evidence, differentiate explicit requirements from interpretation, and refuse unsupported conclusions. Postvalidate IDs and quotes; if invalid, mark warnings/withhold unsupported portions. Never present automatically checked citation as expert-reviewed fact.

Handle missing API key, free-provider rate limit, malformed model output, network failure and timeout. Do not loop unbounded or silently switch to paid models. Default model `openrouter/free` and configurable `OPENROUTER_MODEL`; deployment is still subject to provider availability.

## 8. Evaluation and DoD
`evals/questions.json` contains at least five labeled cases: known requirement retrieval, V1/V2 filtering, conditional exception, unknown question, citation rejection, and model-unavailable fallback (may be six). Manually compare expected top-5 IDs. Automate version exclusion, exact quote validation and fallback tests.

**Done means:** A–E functions implemented, `npm run test`, `npm run lint`, `npm run build` pass or limitations are reported, live Vercel URL manually verified, synthetic banner prominent, disabled MCP menu inert, no secrets/private documents committed. No unverified quality claims.

## 9. Security, compliance and product honesty
Public GitHub/Vercel/demo external LLM may contain **only invented, license-safe data**. An actual company deployment—even small internal use—requires separately approved infrastructure and document/model access policy; Vercel Hobby must not be assumed suitable for business use. Local MCP execution does not itself guarantee local inference: tool outputs may be transmitted to a connected AI model.

No real CCC/OEM interpretations are offered in MVP. No GDPR/AI Act or product certification claims are made. Attribution validity and logical correctness are different things.

## 10. Future
A local stdio MCP adapter will reuse core retrieval and provide `search_requirements`, `get_requirement`, `get_related_sections`, `compare_requirements` only when implemented. Later: authorized PDF parsing, hybrid search/rerank, cross-reference graph, version impact analysis, expert-reviewed shared Q&A, access controls and audit logging.
