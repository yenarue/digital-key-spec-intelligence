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
