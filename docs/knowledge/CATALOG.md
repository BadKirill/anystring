# Anystring knowledge catalog

Human-readable map of the whole project: what exists, how it is written, and
which rules apply. Agents start at [INDEX.md](INDEX.md). This file is mirrored
to the GitHub Wiki home page.

**Live app:** https://badkirill.github.io/anystring/  
**Repo:** https://github.com/BadKirill/anystring  
**Wiki:** https://github.com/BadKirill/anystring/wiki

---

## 1. Product

Mobile-first guitar/bass tuner with fully editable per-string tunings plus a
chromatic (nearest-note) tab. One TypeScript codebase: Vite + React PWA now;
Capacitor store shells later. No backend — custom tunings live in `localStorage`.

## 2. Architecture (layers)

```
Mic → AudioWorklet (8192) → pitchy → stabilize
  → strings: analyze(tuning) | chromatic: analyzeChromatic → UI gauge/hint
Presets + custom editor → storage → active Tuning → string analyzer
```

| Layer        | Path                          | Role                                            |
| ------------ | ----------------------------- | ----------------------------------------------- |
| Core music   | `src/core/music/`             | Notes, MIDI, Hz, cents, nearestPitch — pure TS  |
| Core signal  | `src/core/signal/`            | Pitch display stabilizer, pluck synth           |
| Core tunings | `src/core/tunings/`           | Tuning model, presets, analyzer, custom helpers |
| Audio        | `src/audio/`                  | Mic, worklet, pitchy, reference tone, hooks     |
| Components   | `src/components/`             | React UI                                        |
| State        | `src/state/`                  | `useTunerState` and helpers                     |
| Storage      | `src/storage/`                | localStorage v2 + legacy migration              |
| E2E          | `e2e/`                        | Playwright + synthetic mic                      |
| Docs         | `docs/`                       | Plan, CI, this knowledge tree                   |
| Agent rules  | `AGENTS.md`, `.cursor/rules/` | Workflow + style                                |

**Portability rule:** `src/core/**` must not import React, DOM, or
`audio` / `components` / `state` / `storage` (ESLint).

## 3. Stack (allowed only)

Vite, React 19, TypeScript strict, `vite-plugin-pwa`, Web Audio + AudioWorklet,
`pitchy` (MPM), Capacitor (planned), localStorage, Vitest, Playwright,
ESLint (`typescript-eslint` strict + sonarjs), Prettier.

Not in scope: Redux/Zustand/TanStack Query, backend, cloud sync, RN (unless
planned), alternate pitch libs, CSS frameworks, other test runners.

## 4. Patterns (how code is written)

- Prefer **pure functions and plain data** over classes/mutation.
- Domain names (`centsBetween`, `analyzeString`), not `helper`/`utils`.
- Colocated tests for every `src/core/` module: `foo.ts` + `foo.test.ts`.
- Platform adapters stay thin (`micStream`, `customTuningsStore`).
- UI copy centralized in `src/components/strings.ts` (`UI` object).
- Screen state composed in `useTunerState` (hooks, not a global store).
- Draft edits set `id` to `custom-draft` until save.
- Comments explain **why**; Prettier owns formatting.

## 5. Hard rules

See [patterns-and-rules](areas/patterns-and-rules.md). Summary:

- Mic processing filters off; window 8192; in-tune ±5 cents.
- Complexity budgets enforced by ESLint — do not disable.
- `npm run check` must pass; one branch/PR per change.

## 6. Area guides

- [Architecture & data flow](areas/architecture.md)
- [Core: music](areas/core-music.md)
- [Core: signal](areas/core-signal.md)
- [Core: tunings](areas/core-tunings.md)
- [Audio pipeline](areas/audio.md)
- [Components / UI](areas/components.md)
- [State](areas/state.md)
- [Storage](areas/storage.md)
- [Testing](areas/testing.md)
- [CI/CD](areas/ci-cd.md)
- [Patterns & rules](areas/patterns-and-rules.md)
- [Tooling](areas/tooling.md)
- [Complete file index](areas/file-index.md)

## 7. Maintenance

Portable protocol for every agent tool: [AGENT_PROTOCOL.md](AGENT_PROTOCOL.md)

When code structure or contracts change, update:

1. `npm run knowledge:refresh` (auto file inventory)
2. Matching `areas/*.md` (keep **See also** links useful)
3. This `CATALOG.md`
4. `graph.json` nodes/edges/tags
5. `INDEX.md` routing if tags change
6. `npm run knowledge:check` (local `check` + CI job)
7. Wiki: CI on `master`, or locally `npm run knowledge:wiki`

Also loaded by non-Cursor agents via `AGENTS.md`, `CLAUDE.md`,
`.github/copilot-instructions.md`, `llms.txt`.
