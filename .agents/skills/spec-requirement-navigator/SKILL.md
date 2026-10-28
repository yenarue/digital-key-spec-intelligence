---
name: spec-requirement-navigator
description: Find, compare, and interpret versioned Digital Key-style specification requirements with exact traceable evidence. Use for questions asking where a requirement is, whether a behavior is required or optional, what conditions or exceptions apply, or how requirements differ by version. Do not use for unrelated coding or general conversation.
---

# Spec Requirement Navigator

Use this **investigation workflow**, not memory-based answers. It does not itself provide a search server or model. It may work with the repository's fictional demo data now and an approved Local MCP later.

## Scope and source selection

1. Determine **corpus and version** from the user's question. In this public repository, the only committed sources are `data/demo/spec-v1.json` and `data/demo/spec-v2.json`. These are **independently authored fictional specifications**, not CCC V3.1.4/V4.1.0. Never equate their version labels with CCC releases.
2. If version unspecified, search both demo versions and state that scope; if user specifies a version, search **only** that version.
3. If the user requests real CCC specifications, only use them through **already available, authorized local tooling** (future MCP). Without that source/tool, state that the actual document cannot be verified; do not answer real CCC normative questions from fictional examples or model memory.
4. Do not forward actual CCC/OEM/company text to personal cloud AI services, public Web API, Vercel or GitHub. Local MCP outputs to enterprise-approved Codex/Claude/Gemini are a future separate controlled mode. Never assume access, permission, or a working MCP that is not present.

## Procedure

1. **Frame the question.** Identify feature (e.g., Sharing, Revocation, BLE/UWB/NFC), actors (Owner/Friend/Vehicle), required operation, condition, exception, and versions. Preserve the user's wording.
2. **Retrieve candidate requirements.** Prefer available implemented tools when actually present: shared `spec-core` retrieval or registered MCP `search_requirements`. Do not invent a tool name or endpoint as if it exists. Otherwise inspect the local demo JSON, matching both English/Korean vocabulary and `heading`, `keywords`, `text`; report if search was manual. Do not claim a vector/semantic rank when only lexical scanning occurred.
3. **Inspect exact original text.** Resolve `documentId`, `version`, `sectionId`, `requirementId`, and `text` in the source. Citation ID format for the current fictional corpus is `SRC:<documentId>:<version>:<requirementId>` (e.g. `SRC:DKSI-SYNTHETIC:V2:DEMO-V2-REQ-010`). Use only IDs found in source.
4. **Follow relevant references.** For every central conditional requirement, inspect `references[]` in the same version and retrieve referenced requirement texts when available. Do not merge V1 and V2 as though both applied simultaneously.
5. **Interpret cautiously.** Separate:
   - **Explicit normative text** (including SHALL/SHOULD/MAY as defined by the hypothetical document),
   - **Applicability** (who, which feature, which version, which preconditions),
   - **Exceptions / alternatives**, and
   - **Inference** (engineering hypothesis, not guaranteed by the source).
6. **Validate evidence.** Every normative claim must have an existing source ID and an exact text excerpt. Check that excerpts are verbatim substrings of `text`. Do not describe a syntactically valid citation as proof of the reasoning.
7. **Handle insufficient results.** If no cited clause actually answers the question, say **Insufficient Evidence**. Do not invent cross-references, requirements, confidence percentages or actual CCC obligations.

## Response format

- **검색 범위:** source title, synthetic or actual, versions and retrieval method.
- **결론:** concise answer limited to cited evidence, or `근거 부족`.
- **근거:** for each claim, `[SRC:...]`, Section and exact original excerpt.
- **적용 조건·예외:** explicit conditions, referenced requirements, and potential ambiguity.
- **미확인 사항:** anything not supported, additional needed source, or reason not to conclude.

In public demo mode, clearly label conclusions **가상/합성 규격에 대한 답변 — 실제 CCC 규정이 아님**. Prefer actionable citations over lengthy paraphrases.

## Demo checks

- “가상 V2에서 UWB ranging 불가 시 NFC는?” → examine V2 REQ-010, -011 and permission-related -012 as needed.
- “가상 V1에서 Friend 재공유가 가능한가?” → V1 REQ-004 only; do not substitute V2 delegation.
- “CCC 4.1.0의 실제 section을 알려줘” without access to approved actual-source tools → state limitation, no invented section.
- Unrelated “우주선 엔진” → Insufficient Evidence.

This Skill guides how an agent uses tools; it **is not** a Vercel route, an MCP tool, an external search API, or evidence of deployment.
