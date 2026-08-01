# Wiki sync reference (explicit commands only)

Используй проверенный локальный снимок General Wiki как базу. Обычная индексация
не обращается к Notion. Любое чтение или изменение внешней Wiki выполняется
только по явной просьбе или отдельной команде с обязательным read-back.
Автоматизации на commit/PR пока нет.

## Local base

`docs/knowledge/` — always the index for agents.

## Explicit external commands

| Command                    | Destination                                          |
| -------------------------- | ---------------------------------------------------- |
| `npm run knowledge:wiki`   | https://github.com/BadKirill/anystring/wiki          |
| `npm run knowledge:notion` | Notion Anytune Wiki (`NOTION_API_KEY`, never commit) |

There is **no** automatic sync on commit/PR. The GitHub Action, if present, is
`workflow_dispatch` only.

## Read-back

After any external wiki read or write:

1. Re-fetch or re-open the remote page(s).
2. Confirm to the user what was read or what changed.
3. Do not assume success from a script exit code alone.

## GitHub Wiki mapping (when syncing)

| Repo path                          | Wiki page           |
| ---------------------------------- | ------------------- |
| `docs/knowledge/CATALOG.md`        | `Home.md`           |
| `docs/knowledge/INDEX.md`          | `Agent-Index.md`    |
| `docs/knowledge/AGENT_PROTOCOL.md` | `Agent-Protocol.md` |
| `docs/knowledge/areas/*.md`        | Title-Case page     |
| `docs/knowledge/graph.json`        | `Graph.md`          |
