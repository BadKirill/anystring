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
npm run knowledge:sync
```

Update affected knowledge pages. `knowledge:sync` mirrors GitHub Wiki and Notion
Wiki (`NOTION_API_KEY` required for Notion; never commit the token).

## Invariants

- Mic processing filters off; pitch window 8192; `src/core` stays pure TypeScript
- `npm run check` must pass (includes knowledge check)
