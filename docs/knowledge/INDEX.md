# Anystring knowledge index (agent entry)

Portable protocol (all tools): [`AGENT_PROTOCOL.md`](AGENT_PROTOCOL.md)

**Read this first** on any code-change request. Do **not** scan the whole repo.
Route via tags → open only matching area pages → open source files from the
file map. After structural changes: `npm run knowledge:refresh`, update docs,
`npm run knowledge:check` (wiki syncs on `master` via CI; locally
`npm run knowledge:wiki`).

## Selective reading protocol

1. Classify the task (tags below).
2. Open `docs/knowledge/areas/<page>.md` for each matched tag (usually 1–3 pages).
3. Open only listed source files; prefer tests next to modules you touch.
4. Skip unrelated layers. `src/core/` stays pure TS — never import platform code into it.
5. If the change adds/renames modules, public APIs, storage keys, audio constants,
   UI flows, or CI — update `CATALOG.md`, `graph.json`, affected area pages, then
   run `npm run knowledge:check` and `npm run knowledge:wiki`.

Machine graph: [`graph.json`](graph.json) · Human catalog: [`CATALOG.md`](CATALOG.md)

Validate locally: `npm run knowledge:check` (also part of `npm run check` and CI).
Refresh inventory: `npm run knowledge:refresh`.

## Tag → area routing

| Tags / task keywords                                                         | Read                                                 |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| pitch, mic, worklet, clarity, AGC, reference tone, start/stop listening      | [audio.md](areas/audio.md)                           |
| note, MIDI, Hz, cents, octave, nearestPitch                                  | [core-music.md](areas/core-music.md)                 |
| stabilizer, pluck synth, jitter, lock                                        | [core-signal.md](areas/core-signal.md)               |
| tuning, preset, analyzer, string target, chromatic, custom draft, My tunings | [core-tunings.md](areas/core-tunings.md)             |
| gauge, sheet, picker, swipe, InstallHint, UI copy, screen tabs               | [components.md](areas/components.md)                 |
| useTunerState, draft save, manual/auto string, Strings/Chromatic screen      | [state.md](areas/state.md)                           |
| localStorage, v2 keys, migrate, persist                                      | [storage.md](areas/storage.md)                       |
| vitest, playwright, stub mic, e2e                                            | [testing.md](areas/testing.md)                       |
| CI, deploy, Pages, workflows                                                 | [ci-cd.md](areas/ci-cd.md)                           |
| Capacitor, iOS, Android, native build, permissions, store submission         | [native-shell.md](areas/native-shell.md)             |
| eslint, prettier, complexity, stack limits                                   | [patterns-and-rules.md](areas/patterns-and-rules.md) |
| vite, PWA, tsconfig, package scripts                                         | [tooling.md](areas/tooling.md)                       |
| architecture, data flow, layers                                              | [architecture.md](areas/architecture.md)             |
| “where is file X?” / full inventory                                          | [file-index.md](areas/file-index.md)                 |

## Hard constraints (always)

- Mic: `echoCancellation`, `noiseSuppression`, `autoGainControl` **false**.
- Pitch window: **8192** samples (bass ~43 Hz).
- Functions ≤ 50 lines; complexity/cognitive ≤ 10; nesting ≤ 3.
- No `any`, `!`, `@ts-ignore`. Prefer pure data + functions.
- `npm run check` before finishing.
- Branch + PR per change; no drive-by docs unless asked (except this knowledge tree when it must stay accurate).

## Wiki mirror

Repo catalog is the source of truth. External human wiki:
https://github.com/BadKirill/anystring/wiki

Sync command: `npm run knowledge:wiki` (pushes markdown + `_Sidebar.md`, removes
stale wiki pages). Banner links point at a branch where the source file exists on
`origin` (falls back to path-only if unpushed).

There is no GitHub Wiki MCP in the current Cursor MCP set — agents use the script
(or equivalent `git` push to `anystring.wiki`).
