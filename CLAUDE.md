# CLAUDE.md

@AGENTS.md

## Notes for Claude Code

- `AGENTS.md` (imported above) is the single source of truth for this repo. It was written for Codex, but every rule applies to Claude Code as well: read "Codex" as "the coding agent". Edit `AGENTS.md`, not this file, when project rules change.
- Repo-local skills live in `.agents/skills/`. `.claude/skills` is a symlink to that directory, so Claude Code discovers the same skills (`spec-requirement-navigator`, `spec-answer-auditor`). Add or edit skills under `.agents/skills/` only.
- "Verify ... in Codex" / "tested in an actual agent session" in `AGENTS.md`: a Claude Code session also counts, but record which agent was used when marking a skill as tested.
