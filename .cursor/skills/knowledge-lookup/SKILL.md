---
name: knowledge-lookup
description: >-
  Resolves AnyTune/Anystring code-change tasks via the repo-local knowledge
  graph (docs/knowledge) with selective file reads, then updates the catalog
  and both external wikis (GitHub Wiki + Notion). Use when the user asks to
  implement, fix, refactor, explore architecture, or change project structure —
  before scanning the whole codebase.
---

# Knowledge lookup agent

## Goal

Answer “what do I need to read/change?” from the knowledge tree so the session
avoids full-repo analysis and excess tokens. Keep graph + wikis accurate.

## Workflow

Copy and track:

```
Knowledge lookup:
- [ ] 1. Read docs/knowledge/AGENT_PROTOCOL.md + INDEX.md
- [ ] 2. Pick tags for the user task
- [ ] 3. Read matched area page(s) only
- [ ] 4. Open listed source + tests
- [ ] 5. Implement / answer
- [ ] 6. If structure/contracts changed → npm run knowledge:refresh + edit areas
- [ ] 7. Run npm run knowledge:check
- [ ] 8. Run npm run knowledge:sync  (GitHub Wiki + Notion Wiki)
```

### 1–2. Route

From the user request, choose tags (examples):

| User intent                     | Tags                           |
| ------------------------------- | ------------------------------ |
| Mic / pitch / stop listening    | `mic`, `worklet`, `pitchy`     |
| Cents / notes / Hz              | `music`, `cents`               |
| Needle jitter / lock            | `stabilizer`                   |
| Presets / My tunings / analyzer | `tuning`, `custom`, `analyzer` |
| Gauge / picker / copy           | `ui`, `gauge`, `strings`       |
| Save/load / migrate             | `storage`, `persist`           |
| Tests / CI                      | `test`, `ci`                   |
| New folder / architecture       | `architecture`, `patterns`     |

Open `docs/knowledge/areas/<page>.md` for each tag via INDEX routing.

### 3–4. Read narrowly

- Prefer area “Open when” / module tables over grepping the whole `src/`.
- For “where is X?”, use `areas/file-index.md`.
- Only widen search if the area page is missing the answer — then update the
  knowledge docs so the next agent finds it.

### 5. Implement

Follow `AGENTS.md` + `.cursor/rules/code-style.md`. Stay in the scoped layer.

### 6–8. Maintain mirrors (mandatory on structural changes)

Source of truth: `docs/knowledge/`.

```bash
npm run knowledge:check
npm run knowledge:sync    # knowledge:wiki + knowledge:notion
```

| Mirror      | URL                                                                    |
| ----------- | ---------------------------------------------------------------------- |
| GitHub Wiki | https://github.com/BadKirill/anystring/wiki                            |
| Notion Wiki | https://app.notion.com/p/Anytune-Wiki-3a57e1830c32800c8d3be98bdb534bc4 |

Notion needs `NOTION_API_KEY` in the environment (never commit it). If missing,
sync GitHub wiki anyway and report that Notion was skipped.

## Output shape (when reporting context)

```markdown
## Knowledge context

- Tags: …
- Areas read: …
- Files to touch: …
- Constraints: …
- Wikis synced: GitHub / Notion / skipped+why
```

Then proceed with the task.
