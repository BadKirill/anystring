# GitHub Copilot — AnyTune

You are working in the AnyTune repository. Obey [`AGENTS.md`](../AGENTS.md) and
[`docs/knowledge/AGENT_PROTOCOL.md`](../docs/knowledge/AGENT_PROTOCOL.md).

## Required reading order for code tasks

1. `docs/knowledge/INDEX.md` (tag → area routing)
2. Only the matching `docs/knowledge/areas/*.md` pages
3. Only the source files those pages list

Do not scan the whole repo by default.

## After structural edits

```bash
npm run knowledge:refresh
npm run knowledge:check
```

Update affected **local** knowledge pages under `docs/knowledge/`.
Do not call Notion or GitHub Wiki unless the user explicitly asks; then run the
named command and read-back the remote result. No commit/PR wiki automation.

## Invariants

- Mic processing filters off; pitch window 8192; `src/core` stays pure TypeScript
- `npm run check` must pass (includes knowledge check)
