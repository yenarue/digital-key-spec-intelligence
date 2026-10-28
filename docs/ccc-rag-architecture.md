# Architecture ADR: Real CCC PDFs with Two LLM Processing Modes

**Date:** 2026-10-29  
**Status:** Approved direction, implementation pending  
**Applies to:** CCC Digital Key Specification 3.1.4 and 4.1.0 that the operator has obtained separately.

## 1. Why this changes the initial MVP
DKSI must deliver more than lexical search: the **real value** is version-aware retrieval, grounded reasoning about conditions/exceptions, and verifiable sources from the operator's actual documents. Synthetic V1/V2 documents remain useful for public Vercel demonstration, tests, and CI, but are not the final knowledge source.

Do not equate `MiniSearch` with RAG by itself: it is one *retrieval* component, while an LLM reasons over the retrieved source evidence. Do not claim embeddings/semantic retrieval if not implemented.

## 2. Rights and data policy (important distinction)
CCC offers V3.1.4/V4.1.0 via a download form for review/educational use, but that does **not automatically grant public redistribution or third-party AI processing**. The CCC IPR Policy (especially §§9.1.2 and 11) grants some **internal** rights to members and limits distribution. Its public text does not establish an absolute universal ban on uploading excerpts to all external LLMs. The precise PDF copyright/legal notice, form terms, CCC authorization and employer policy need review before any cloud transmission of original content. Rights for original full PDF, derived full-text indices, brief excerpts and generated summaries must not be conflated.

Accordingly:
- **Always allowed within this project design:** synthetic fixture data in public repo/Vercel.
- **Real CCC files:** keep local only, excluded from Git and Vercel.
- **Local extraction/retrieval/local inference:** primary implementation path; confirm applicable document notices and organizational policy.
- **External transmission of real excerpts:** technically supported behind a disabled-by-default, explicit permission/consent gate; not enabled for CCC by default. Do not interpret “ZDR” or “no training” as permission to transmit.
- **Public display of large quoted portions:** avoid. Keep copyright/license notices with local source files and restrict rendered excerpts according to applicable permissions.

Primary sources:
- https://carconnectivity.org/digital-key-specification-download-2/
- https://carconnectivity.org/digital-key/
- https://carconnectivity.org/wp-content/uploads/2022/11/CCC-IPR-Policy-042424.pdf
- https://carconnectivity.org/terms-of-use/
- https://openrouter.ai/privacy
- https://openrouter.ai/docs/guides/features/zdr

## 3. Separate deployment/runtime from inference provider

| Runtime | Corpus | Retriever | LLM | Real CCC text leaves PC? |
| --- | --- | --- | --- | --- |
| **Vercel demo** | Synthetic JSON | Shared lexical core | OpenRouter free, server-only | No (only synthetic) |
| **Local Web (preferred real-spec path)** | Local CCC PDFs | Shared core + local parsed index | **Ollama local** | No, assuming no external logs/plugins/routes |
| **Local Web (authorized external mode)** | Local CCC PDFs | Same local core | OpenRouter using **only selected retrieval chunks** | **Yes**; only enable after verifying license, employer policy, and provider terms |
| **Future Local MCP** | Local CCC PDFs | Same shared index | Connected client model | **May** leave PC depending on client/model |

A deployed Vercel function **cannot directly read local PDF files or call the user's localhost Ollama**. Therefore real-doc local reasoning should run from the same Next.js UI on a localhost Node server (`npm run dev:local` or equivalent); no browser-to-cloud route for real contents in local mode. For public-site user-selected local PDFs, an optional future browser-only PDF parser may support on-device search, but local LLM access from a Vercel page needs a separately designed, secured local bridge and is **not** included in v0.1.

## 4. Planned processing pipeline

```text
data/local/ccc/*.pdf (V3.1.4, V4.1.0; gitignored)
  -> local import/parse (PDF.js or Node parser; no network)
  -> page spans + headings + tables + section IDs + notes
  -> persistent local index data/local/index/ (gitignored)
  -> shared version-aware retrieval (MiniSearch lexical v1)
  -> expand heading/conditions/referenced chunks when needed
  -> evidence IDs: document/version/page/section/content hash
  -> provider abstraction:
       (a) Ollama API at localhost:11434 -> local grounded answer
       (b) OpenRouter API -> selected chunks only, after authorization
  -> claim/evidence validation and traceable answer
```

Real specifications may be lengthy and complex. Preserve page numbers and exact source snippets; separately validate requirements that cross page boundaries, tables, footnotes and section numbering. A PDF parser producing text does not guarantee complete or accurate requirement boundaries. Do not assume CCC v3/v4 section IDs are identical.

## 5. Interfaces
- `CorpusProvider`: `listDocuments()`, `getChunks(documentId)`, `getSourceSpan(citationId)`.
  - `SyntheticCorpusProvider`: JSON committed to public repository.
  - `LocalPdfCorpusProvider`: local PDF-derived documents/indices; never bundled.
- `Retriever`: `search(query, {documentIds,versions,topK})`.
- `LLMProvider`: `generateGroundedAnswer({question,evidence,locale})`.
  - `OpenRouterProvider`: network remote; keep key server-only; send minimal excerpts; provider privacy controls with `provider: {zdr:true,data_collection:"deny"}` when compatible, fail closed if no eligible endpoint.
  - `OllamaProvider`: local HTTP API (default `http://localhost:11434/api/chat`); model availability and quality are hardware/model dependent.
- `EvidenceValidator`: check document/version/citation/quote identity; represent unsupported/uncertain statements, never claim full semantic proof.

## 6. Suggested folders and ignored files
```text
data/
  demo/spec-v1.json, spec-v2.json           # committed fictional fixtures
  local/ccc/CCC_Digital_Key_3.1.4.pdf       # gitignored (operator-provided)
  local/ccc/CCC_Digital_Key_4.1.0.pdf       # gitignored
  local/index/                             # gitignored, including derived text/chunks
packages/spec-core/                        # shared corpus/retrieval/citation interfaces
packages/spec-ingest/                      # OPTIONAL local PDF ingestion package
apps/web/                                  # UI, runtime mode and provider selection
apps/mcp/                                  # future only; menu disabled
```
Keep the entire `/data/local/` tree ignored. Never expose real spec via `apps/web/public`, import from client-visible bundles, `next/static`, Vercel assets, test snapshots, screenshots or diagnostic logs.

## 7. UI policy
Show **Source: Synthetic Demo / Local CCC PDFs** and **Inference: OpenRouter / Ollama** as *separate* selectors. In public hosted mode, real CCC source is unavailable and synthetic demo is default. In local mode, choose real documents and Ollama; external OpenRouter for real source stays disabled until the operator explicitly configures and verifies permissions. Show exactly what data is leaving the machine. Local MCP remains disabled/Coming Soon.

## 8. Implementation and acceptance plan
**P0 academic A–E:** complete functional Vercel synthetic RAG web demo with citations (existing PRD).  
**P0 real-spec pilot (next immediately after stable deployment, or earlier if feasible):** local ingestion of two user-supplied CCC PDFs, page/section evidence, common retrieval and local Ollama answer generation; no public publishing.  
**P1 conditional:** explicit external-provider permission gate + minimal-context sending, with no training/ZDR controls when possible, no logs; only after reviewing rights and organizational approval.  
**P2:** local MCP adapter, structure-aware + hybrid retrieval, multi-document requirement relation graph, and team knowledge reuse.

Acceptance for the real-spec pilot: (1) both PDFs are indexed locally without repository changes; (2) filter 3.1.4 vs 4.1.0; (3) each answer cites document/version/page/section and a verifiable exact quote; (4) model-unavailable returns search evidence; (5) no real content reaches GitHub, Vercel, analytics, logs or external LLM by default; (6) test on deliberately ambiguous and unsupported questions; (7) state what parsing missed.

**Explicitly out of scope of this ADR:** legal advice or a guarantee that any external use is permitted. Read the PDF's own Legal Notice/download terms and seek CCC rights clarification when needed.
