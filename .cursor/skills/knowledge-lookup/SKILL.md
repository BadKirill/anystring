---
name: knowledge-lookup
description: >-
  Resolves code-change tasks via the local docs/knowledge General Wiki snapshot
  with selective file reads. Does not contact Notion or GitHub Wiki unless the
  user explicitly asks. Use when implementing, fixing, refactoring, or exploring
  architecture — before scanning the whole codebase.
---

# Knowledge lookup agent

## Goal

Answer “what do I need to read/change?” from the **local** knowledge snapshot
(`docs/knowledge/`) so the session avoids full-repo analysis and excess tokens.

## Wiki policy

Используй проверенный локальный снимок General Wiki как базу. Обычная индексация
не обращается к Notion. Любое чтение или изменение внешней Wiki выполняется
только по явной просьбе или отдельной команде с обязательным read-back.
Автоматизации на commit/PR пока нет.

## Workflow

```
Knowledge lookup:
- [ ] 1. Read docs/knowledge/AGENT_PROTOCOL.md + INDEX.md
- [ ] 2. Pick tags for the user task
- [ ] 3. Read matched area page(s) only (local files)
- [ ] 4. Open listed source + tests
- [ ] 5. Implement / answer
- [ ] 6. If structure changed → knowledge:refresh + edit local areas
- [ ] 7. Run npm run knowledge:check
- [ ] 8. External wiki ONLY if user explicitly asked → then read-back
```

### Route

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

Open `docs/knowledge/areas/<page>.md` via INDEX routing. Never open Notion for
this step.

### Maintain local snapshot

```bash
npm run knowledge:refresh
npm run knowledge:check
```

### External Wiki (explicit request only)

```bash
npm run knowledge:wiki      # GitHub Wiki
npm run knowledge:notion    # Notion (NOTION_API_KEY)
```

After either command: **read-back** remote content and confirm to the user.

## Output shape

```markdown
## Knowledge context

- Tags: …
- Areas read (local): …
- Files to touch: …
- External wiki: not used | used + read-back summary
```
