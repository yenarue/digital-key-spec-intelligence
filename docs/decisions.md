# Implementation decision log

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
