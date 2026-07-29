# Wiki sync reference

## Mirrors

| Source             | Destination         | Command                    |
| ------------------ | ------------------- | -------------------------- |
| `docs/knowledge/*` | GitHub Wiki         | `npm run knowledge:wiki`   |
| `docs/knowledge/*` | Notion Anytune Wiki | `npm run knowledge:notion` |
| both               |                     | `npm run knowledge:sync`   |

Notion parent page:
https://app.notion.com/p/Anytune-Wiki-3a57e1830c32800c8d3be98bdb534bc4

Requires `NOTION_API_KEY` (integration must be connected to that page).
Never commit the token.

GitHub Wiki: https://github.com/BadKirill/anystring/wiki

## GitHub Wiki mapping

| Repo path                          | Wiki page           |
| ---------------------------------- | ------------------- |
| `docs/knowledge/CATALOG.md`        | `Home.md`           |
| `docs/knowledge/INDEX.md`          | `Agent-Index.md`    |
| `docs/knowledge/AGENT_PROTOCOL.md` | `Agent-Protocol.md` |
| `docs/knowledge/areas/*.md`        | Title-Case page     |
| `docs/knowledge/graph.json`        | `Graph.md`          |
| generated                          | `_Sidebar.md`       |

## Commands

```bash
npm run knowledge:check
npm run knowledge:sync
```

Scripts: `scripts/sync-knowledge-wiki.mjs`, `scripts/sync-notion-wiki.mjs`,
`scripts/check-knowledge.mjs`, `scripts/refresh-file-index.mjs`.
