# Agent protocol (all tools)

**Applies to every coding agent** that works on this repo: Cursor, ChatGPT
(Codex / app with repo access), Claude Code, GitHub Copilot, and similar.

Cursor-only files (`.cursor/rules`, `.cursor/skills`) are _extra_. This protocol
is the portable contract.

## Before changing code

1. Open [`INDEX.md`](INDEX.md) — tag → area routing table.
2. Read only the matching `areas/*.md` pages (usually 1–3).
3. Open only the source files those pages list.
4. Do **not** scan the whole repository by default.

Machine map: [`graph.json`](graph.json) · Human overview: [`CATALOG.md`](CATALOG.md)

## After structural changes (mandatory)

If you add/rename/remove modules, change public APIs, storage keys, audio
constants, UI flows, CI, layer rules, or anything described in the knowledge
tree, you **must** keep the graph and **both** external wikis in sync before
finishing the task:

```bash
npm run knowledge:refresh          # regenerate file inventory section
# edit affected areas/*.md + CATALOG.md + graph.json + INDEX.md as needed
npm run knowledge:check            # must pass (also part of npm run check)
npm run knowledge:sync             # GitHub Wiki + Notion Wiki
# equivalent:
#   npm run knowledge:wiki         # https://github.com/BadKirill/anytune/wiki
#   npm run knowledge:notion       # requires NOTION_API_KEY
```

Do **not** skip Notion or GitHub wiki sync when `NOTION_API_KEY` / git credentials
are available. If Notion sync fails for missing credentials, say so explicitly
and still update `docs/knowledge/` + GitHub wiki.

`npm run check` includes `knowledge:check` and must pass.

### External mirrors

| Mirror      | URL                                                                    | Command                                       |
| ----------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| GitHub Wiki | https://github.com/BadKirill/anystring/wiki                            | `npm run knowledge:wiki`                      |
| Notion Wiki | https://app.notion.com/p/Anytune-Wiki-3a57e1830c32800c8d3be98bdb534bc4 | `npm run knowledge:notion` (`NOTION_API_KEY`) |

Source of truth is always `docs/knowledge/` in this repo.

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
