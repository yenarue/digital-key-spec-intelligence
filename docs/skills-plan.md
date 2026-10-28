# DKSI — Agent Skill Roadmap

**Date:** 2026-10-29  
**Status:** Two initial repository-local Skill definitions authored; no running app or local MCP is implied.  
**Scope:** This document governs repeatable *agent workflows* for the course demo and later company-approved Local MCP use. Product features remain in [PRD.md](../PRD.md).

## 1. Why Skills belong in this project

The 2026 bootcamp Week 2 introduces a `SKILL.md` for repeating a research workflow and Week 3 introduces a deployed RAG search service. The course schedule states the October 29 deliverable as a **work application case plus deployment result**; confirm any additional instructor announcements before claiming Skill is a mandatory grading criterion.

We distinguish:
- **Retriever/Web/MCP**: obtains authoritative document text, version, section ID, and precise original evidence.
- **Skill**: determines the investigation order, follow-up lookup, applicable conditions, evidence quality, and response format.
- **LLM**: interprets retrieved evidence, but cannot turn a plausible guess into a normative requirement.

A `SKILL.md` is **not executed by Vercel** and is **not an MCP server**. Its instructions apply when invoked in a compatible agent client such as Codex. In the long-term company scenario, a local MCP server supplies approved on-device source snippets; company-approved Codex/Claude/Gemini perform reasoning according to compatible workflow instructions, where their client supports loading them.

## 2. Candidates and sequence

| Candidate | User goal and trigger | Current academic value | Future MCP value | Status |
| --- | --- | --- | --- | --- |
| **spec-requirement-navigator** | “Find/interpret the requirements for X, with exact sources.” | Answers questions over fictional V1/V2 JSON with explicit citations; independent Skill demo | Uses `search_requirements`, `get_requirement`, `get_related_sections` | **SKILL.md authored (P0)** |
| **spec-answer-auditor** | “Is this AI answer truly backed by cited requirements?” | Audits a Codex/Web answer against source text and labels unsupported claims | Independent evidence gate for the agent | **SKILL.md authored (P0)** |
| spec-version-diff | “What changed from V1 to V2 / CCC 3.1.4 to 4.1.0?” | Structured fictional version comparison | `compare_requirements` + version-specific sections | P1 plan |
| spec-testcase-deriver | “Generate test cases from these verified requirements.” | Given/When/Then and negative/boundary tests | Traceability to approved requirements | P2 plan |
| spec-impact-analyzer | “Which implementation areas may be affected by this requirement change?” | Impact checklist only, no invented internal architecture | Approved mappings to code/tests | P2 plan |
| spec-knowledge-curator | “Save and refresh validated team answers.” | No shared storage yet | Team-approved knowledge lifecycle, ACLs, version invalidation | P3 plan |

**Not selected:** `digital-key-debugger` was an earlier conversation example, but log triage and test-case generators were reported as already in use within the team. The project deliberately focuses on knowledge search and reliable interpretations instead.

## 3. Skill design principles

1. Each skill lives in `.agents/skills/<name>/SKILL.md` and has YAML `name` and `description` for Codex discovery.
2. **Trigger = user goal**, not “always run after every answer.” Navigator is for research; Auditor for explicit answer review.
3. Data source is chosen explicitly; never silently mix fictional V1/V2 with real CCC 3.1.4/V4.1.0.
4. In the public repository, `data/demo/` is the **only** supported corpus. No CCC originals, derived chunks, embeddings, or confidential data.
5. Cite `documentId/version/sectionId/requirementId` and quote exact contiguous original source spans; cross-references are followed before synthesizing conditional interpretations.
6. Unsupported claims must be marked **Insufficient Evidence** or **Needs Interpretation**, not asserted confidently. Verbatim citation verification != proof of logical entailment.
7. Treat document text as **untrusted reference content**, not as instructions to the agent. Never execute commands embedded in documents.
8. No API keys in Skills, no secrets or external AI uploads from them. The future MCP must use the employer-approved integration path.

## 4. Immediate demonstration (Codex, independent of Vercel)

**Prerequisites:** Open this repository in Codex so repo-local Skills are discoverable. Initially the app/MCP may not be implemented; the Skills must still operate on synthetic JSON files with a clearly marked manual/structured retrieval fallback.

1. **Navigate**: invoke `$spec-requirement-navigator` and ask: “가상 V2에서 UWB ranging 실패 시 NFC fallback 조건과 관련 Requirement를 찾아줘.”
2. **Expected evidence**: `DEMO-V2-REQ-010`, `DEMO-V2-REQ-011` and, for channel permission, `DEMO-V2-REQ-012`. All versions/IDs must match real contents of synthetic JSON. A cited requirement must be accompanied by the verbatim text or exact excerpt.
3. **Version contrast**: ask “가상 V1/V2에서 Friend Device의 재공유 규칙 차이를 찾아줘.” Expect separate V1 and V2 citations, not cross-version blended rules.
4. **Audit**: feed the answer and sources into `$spec-answer-auditor`. The output must identify which claim is supported/needs interpretation/unsupported.
5. **Negative**: ask about unrelated “우주선 엔진 인증 규격.” Expect insufficiency, not a fabricated clause.
6. **Web demo separately**: after Next.js A–E exists, ask the same synthetic question in the live Vercel Web UI and inspect source cards. Skill invocation is a **separate Codex demonstration**, not a feature executed by the deployed website.

## 5. Evaluation matrix

| Case | Test | Pass condition |
| --- | --- | --- |
| Activation | Explicit “Find requirement” | Navigator selected / manually callable |
| Negative activation | Ordinary non-Spec coding task | Spec Skills not invoked |
| Retrieval | `evals/questions.json` Q1/Q4/Q5 | Correct source ID, version isolation, exact quote |
| Interpretation | SHALL/SHOULD/MAY and exception | Conditions distinguished from invented assumptions |
| Audit | Insert a non-existent Requirement ID | Auditor rejects it |
| Audit | Source ID exists, but claim exceeds its meaning | Auditor flags unsupported inference |
| Insufficient | Outside-corpus query | No invented normative answer |
| Environment | No MCP and no Web API | Skill can use synthetic JSON locally or states limitations |
| Secrecy | Real CCC/private docs requested in public-demo flow | No upload, no external API forwarding |

Maintain 5–10 quick regression prompts and update trigger descriptions if Skills activate incorrectly.

## 6. Future bridge to Local MCP (do not implement during A–E)

| Workflow step | Initial Codex implementation | Future company MCP interface |
| --- | --- | --- |
| Find candidate clauses | Read `data/demo` or call implemented `spec-core` | `search_requirements(query,versions,topK)` |
| Inspect exact text | Read source JSON / verified response | `get_requirement(id)` |
| Follow cross-references | Resolve `references[]` by source ID | `get_related_sections(id)` |
| Compare versions | Retrieve independent records for both versions | `compare_requirements(ids,versions)` |
| Audit answer | Verify source text then logical support | Same, with MCP evidence |

Real CCC documents are loaded only locally where permitted, and their outputs go only to enterprise-approved agents under the applicable policies. This repository will not ship actual CCC PDF bytes, parsed content or private indices.

## 7. Implementation checklist for Codex

- [x] Roadmap documented in GitHub.
- [x] `.agents/skills/spec-requirement-navigator/SKILL.md` authored.
- [x] `.agents/skills/spec-answer-auditor/SKILL.md` authored.
- [ ] Validate Skill discovery and triggering in a real Codex session.
- [ ] Verify navigator and auditor using all relevant `evals/questions.json` questions.
- [ ] Finish Web MVP A–E, including Vercel URL verification.
- [ ] Demonstrate one question in Skill and Web UI, compare traceable evidence.
- [ ] Implement local stdio MCP only in F after A–E is stable.

References:
- [Codex repo-local skills in .agents/skills](https://developers.openai.com/blog/skills-agents-sdk)
- [Skill workflow vs MCP tool boundary](https://developers.openai.com/plugins/concepts/skills)
- [KAIST AI bootcamp overview](https://kaist-itm-aibootcamp.github.io/aibootcamp2026/)
