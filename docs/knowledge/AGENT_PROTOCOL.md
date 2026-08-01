# Agent protocol (all tools)

**Applies to every coding agent** that works on this repo: Cursor, ChatGPT
(Codex / app with repo access), Claude Code, GitHub Copilot, and similar.

Cursor-only files (`.cursor/rules`, `.cursor/skills`) are _extra_. This protocol
is the portable contract.

## Wiki policy (mandatory)

Используй проверенный локальный снимок General Wiki как базу. Обычная индексация
не обращается к Notion. Любое чтение или изменение внешней Wiki выполняется
только по явной просьбе или отдельной команде с обязательным read-back.
Автоматизации на commit/PR пока нет.

| Layer          | Role                                                        |
| -------------- | ----------------------------------------------------------- |
| Local snapshot | `docs/knowledge/` — **base for all indexing and code work** |
| GitHub Wiki    | External mirror — explicit command only + read-back         |
| Notion Wiki    | External mirror — explicit command only + read-back         |

## Before changing code

1. Open [`INDEX.md`](INDEX.md) — tag → area routing table.
2. Read only the matching `areas/*.md` pages (usually 1–3).
3. Open only the source files those pages list.
4. Do **not** scan the whole repository by default.
5. Do **not** open Notion or GitHub Wiki for ordinary indexing.

Machine map: [`graph.json`](graph.json) · Human overview: [`CATALOG.md`](CATALOG.md)

## After structural changes (local only)

If you add/rename/remove modules, change public APIs, storage keys, audio
constants, UI flows, CI, layer rules, or anything described in the knowledge
tree, update the **local** snapshot before finishing:

```bash
npm run knowledge:refresh          # regenerate file inventory section
# edit affected areas/*.md + CATALOG.md + graph.json + INDEX.md as needed
npm run knowledge:check            # must pass (also part of npm run check)
```

Do **not** run `knowledge:wiki` / `knowledge:notion` unless the user explicitly
asked to update an external Wiki.

## External Wiki commands (explicit only)

| Command                    | Target                                      |
| -------------------------- | ------------------------------------------- |
| `npm run knowledge:wiki`   | https://github.com/BadKirill/anystring/wiki |
| `npm run knowledge:notion` | Notion Anytune Wiki (`NOTION_API_KEY`)      |

After any external read/write: **read-back** the remote content and report what
was seen or changed. Never commit API tokens.

## Hard constraints (always)

- Mic: `echoCancellation`, `noiseSuppression`, `autoGainControl` = **false**
- Pitch window: **8192** samples
- Functions ≤ 50 lines; complexity/cognitive ≤ 10; nesting ≤ 3
- `src/core/` stays pure TS (no React/DOM/platform imports)
- One branch + PR per change; no Cursor/ChatGPT attribution in commits/PRs

## ChatGPT app / Project knowledge

If the tool does **not** auto-load the repo (ChatGPT Project, custom GPT, paste
chat): attach or pin at least:

1. `docs/knowledge/INDEX.md`
2. `docs/knowledge/CATALOG.md`
3. This file (`AGENT_PROTOCOL.md`)

Then follow the same selective-reading steps. Prefer connecting the GitHub repo
(Codex / ChatGPT with repo) so `AGENTS.md` at the repo root is loaded first.

## Entry points by tool

| Tool                 | Loads first                                 |
| -------------------- | ------------------------------------------- |
| Any / Codex          | `AGENTS.md` → this protocol → `INDEX.md`    |
| Cursor               | above + `.cursor/rules/knowledge-graph.mdc` |
| Claude Code          | `CLAUDE.md` → `AGENTS.md`                   |
| GitHub Copilot       | `.github/copilot-instructions.md`           |
| Generic LLM crawlers | `llms.txt`                                  |
