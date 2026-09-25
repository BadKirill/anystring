# Complete file index

Tags: `inventory`, `files`  
Purpose: locate any project file without scanning the tree. Excludes
`node_modules/`, `dist/`, lockfile blob, binary assets details.

## Agent & docs

| Path                                       | Purpose                             |
| ------------------------------------------ | ----------------------------------- |
| `AGENTS.md`                                | Agent workflow, stack, hard rules   |
| `README.md`                                | Human project intro                 |
| `docs/DEVELOPMENT_PLAN.md`                 | Architecture decisions + roadmap    |
| `docs/CI.md`                               | CI/CD explanation                   |
| `docs/knowledge/AGENT_PROTOCOL.md`         | Portable protocol (all agent tools) |
| `docs/knowledge/INDEX.md`                  | Agent selective-reading entry       |
| `docs/knowledge/CATALOG.md`                | Human catalog (wiki Home)           |
| `docs/knowledge/graph.json`                | Machine knowledge graph             |
| `docs/knowledge/areas/*.md`                | Area deep-dives                     |
| `AGENTS.md` / `CLAUDE.md` / `llms.txt`     | Non-Cursor agent entry points       |
| `.github/copilot-instructions.md`          | GitHub Copilot                      |
| `.cursor/rules/code-style.md`              | Always-on style rule                |
| `.cursor/rules/sdd-tdd.mdc`                | Always-on SDD+TDD / Linus / SOLID   |
| `.cursor/rules/knowledge-graph.mdc`        | Selective reading + wiki sync rule  |
| `.cursor/skills/knowledge-lookup/SKILL.md` | Lookup agent skill                  |

## Config / root

| Path                              | Purpose                 |
| --------------------------------- | ----------------------- |
| `package.json`                    | Scripts & deps          |
| `package-lock.json`               | Lockfile                |
| `eslint.config.js`                | Lint + core portability |
| `vite.config.ts`                  | Vite, PWA, Vitest       |
| `playwright.config.ts`            | E2E                     |
| `playwright.store.config.ts`      | Store screenshot config |
| `capacitor.config.ts`             | Capacitor app id/name   |
| `tsconfig.json`                   | Solution                |
| `tsconfig.app.json`               | App TS                  |
| `tsconfig.node.json`              | Node/tooling TS         |
| `.prettierrc` / `.prettierignore` | Format                  |
| `.gitignore`                      | Ignores                 |
| `index.html`                      | Marketing landing       |
| `app/index.html`                  | Tuner SPA shell         |

## CI

| Path                                   | Purpose                         |
| -------------------------------------- | ------------------------------- |
| `.github/workflows/ci.yml`             | Six PR checks (incl. knowledge) |
| `.github/workflows/deploy.yml`         | Pages + live smoke              |
| `.github/workflows/knowledge-wiki.yml` | Manual GitHub/Notion wiki sync  |

## `src/` entry

| Path                            | Purpose                    |
| ------------------------------- | -------------------------- |
| `src/main.tsx`                  | React mount + PWA register |
| `src/App.tsx` / `App.test.tsx`  | Screen composition         |
| `src/App.gauge.test.tsx`        | In-tune / chromatic gauge  |
| `src/App.css` / `src/index.css` | Styles                     |
| `src/vite-env.d.ts`             | Vite types                 |

## `src/core/music/`

| Path                                 | Purpose                 |
| ------------------------------------ | ----------------------- |
| `notes.ts` / `notes.test.ts`         | Note names, Pitch, MIDI |
| `frequency.ts` / `frequency.test.ts` | Hz ↔ MIDI               |
| `cents.ts` / `cents.test.ts`         | Cents offset            |
| `index.ts`                           | Barrel                  |

## `src/core/signal/`

| Path                              | Purpose            |
| --------------------------------- | ------------------ |
| `pitchStabilizer.ts` / `.test.ts` | Display stabilizer |
| `pluckedTone.ts` / `.test.ts`     | Pluck synthesis    |

## `src/core/tunings/`

| Path                       | Purpose                       |
| -------------------------- | ----------------------------- |
| `types.ts`                 | Tuning types                  |
| `presets.ts` / `.test.ts`  | Built-in tunings              |
| `analyzer.ts` / `.test.ts` | Nearest string + cents        |
| `custom.ts` / `.test.ts`   | Draft / My tunings predicates |
| `index.ts`                 | Barrel                        |

## `src/audio/`

| Path                            | Purpose                   |
| ------------------------------- | ------------------------- |
| `micStream.ts`                  | getUserMedia + session    |
| `capture-processor.ts`          | AudioWorklet processor    |
| `pitchDetector.ts` / `.test.ts` | pitchy wrapper            |
| `micWindowHandler.ts`           | Median / jump gate        |
| `micSessionControl.ts`          | Start/stop orchestration  |
| `useMicControls.ts`             | Mic controls hook         |
| `usePitch.ts`                   | Public pitch hook         |
| `pitchState.ts`                 | Status types              |
| `pitchGate.ts`                  | Suppress during reference |
| `referenceTone.ts`              | Play reference pitch      |
| `appResume.ts`                  | Visibility resume         |
| `audioContextResume.ts`         | Bounded resume / rebuild  |
| `worklet-types.d.ts`            | Types                     |

## `src/platform/`

| Path                         | Purpose                                |
| ---------------------------- | -------------------------------------- |
| `runtime.ts`                 | `isNativePlatform()`                   |
| `audioSession.ts`            | iOS silent-switch / session            |
| `appVersion.ts` / `.test.ts` | Installed vs bundled version for About |

## `src/components/`

| Path                                           | Purpose              |
| ---------------------------------------------- | -------------------- |
| `TunerGauge.tsx`                               | Needle gauge         |
| `StringList.tsx`                               | Strings UI           |
| `stringRailOverflow.ts` / `.test.ts`           | Overflow rail math   |
| `reviveOverflowScroll.ts` / `.test.ts`         | Resume scroll freeze |
| `useStringRailScroll.ts`                       | String row scroll    |
| `TuneDirectionHint.tsx`                        | Hint / errors        |
| `PresetPicker.tsx`                             | Tuning picker        |
| `CustomTuningList.tsx` / `CustomTuningRow.tsx` | My tunings rows      |
| `NotePicker.tsx`                               | Note/octave picker   |
| `Sheet.tsx`                                    | Modal sheet          |
| `SwipeableRow.tsx` / `useSwipeOffset.ts`       | Swipe actions        |
| `TextField.tsx`                                | Text input           |
| `InstallHint.tsx`                              | PWA install tip      |
| `AboutSheet.tsx`                               | Version / privacy    |
| `useLockBodyScroll.ts`                         | Scroll lock          |
| `strings.ts`                                   | UI copy              |

## `src/state/`

| Path                     | Purpose             |
| ------------------------ | ------------------- |
| `appState.ts`            | `useTunerState`     |
| `useSavedTunings.ts`     | Saved list hook     |
| `useStableAnalysis.ts`   | Stabilized analysis |
| `customTuningActions.ts` | Action factories    |
| `tuningDefaults.ts`      | Default tuning      |

## `src/storage/`

| Path                                 | Purpose         |
| ------------------------------------ | --------------- |
| `customTuningsStore.ts` / `.test.ts` | Persistence API |

## `src/test/`

| Path                  | Purpose                         |
| --------------------- | ------------------------------- |
| `vitest.setup.ts`     | jsdom polyfills, RTL cleanup    |
| `fakeAudioContext.ts` | Web Audio / MediaStream doubles |
| `memoryStorage.ts`    | In-memory `localStorage`        |

## E2E & scripts / public

| Path                              | Purpose                  |
| --------------------------------- | ------------------------ |
| `e2e/helpers.ts`                  | Mic stubs & waits        |
| `e2e/about.spec.ts`               | About version            |
| `e2e/landing.spec.ts`             | Landing → /app           |
| `e2e/smoke.spec.ts`               | Live smoke               |
| `e2e/tuner.spec.ts`               | Tuner flow               |
| `e2e/mic-permissions.spec.ts`     | Mic deny / missing copy  |
| `e2e/reference-tone.spec.ts`      | String/note reference    |
| `e2e/background-resume.spec.ts`   | Long-background recovery |
| `e2e/custom-tuning.spec.ts`       | Custom save              |
| `e2e/ukulele.spec.ts`             | Instrument cards         |
| `e2e/string-list.spec.ts`         | One-row string rail      |
| `e2e/stop-tuning.spec.ts`         | Stop listening           |
| `e2e/store/screenshots.spec.ts`   | Store listing PNGs       |
| `e2e/store/marketingFrame.ts`     | Store shot compositor    |
| `scripts/generate-icons.mjs`      | Icons                    |
| `scripts/appReleaseVersion.ts`    | Version SSOT logic       |
| `scripts/stampNativeVersion.ts`   | Stamp iOS versions       |
| `scripts/bumpAppVersion.ts`       | `npm run version:*`      |
| `scripts/check-knowledge.mjs`     | Knowledge integrity      |
| `scripts/refresh-file-index.mjs`  | Auto inventory           |
| `scripts/sync-knowledge-wiki.mjs` | GitHub Wiki sync         |
| `scripts/sync-notion-wiki.mjs`    | Notion Wiki sync         |
| `scripts/native-e2e.sh`           | Maestro native e2e       |
| `store/play-listing/COPY.md`      | Play Console listing     |
| `public/*`                        | PWA icons / svg          |

## When to update this page

Any added/removed/renamed source or config file in the repo (non-generated).
`npm run knowledge:check` fails if a `src/` file is missing here.

## See also

- [INDEX.md](../INDEX.md) · [architecture.md](architecture.md)

## Auto inventory

<!-- AUTO:FILE-INDEX:START -->

_Generated by `npm run knowledge:refresh`. Do not edit between markers._

### Source (`src/`)

| Path                                          | Notes |
| --------------------------------------------- | ----- |
| `src/App.css`                                 |       |
| `src/App.gauge.test.tsx`                      |       |
| `src/App.test.tsx`                            |       |
| `src/App.tsx`                                 |       |
| `src/audio/appResume.test.ts`                 |       |
| `src/audio/appResume.ts`                      |       |
| `src/audio/audioContextResume.test.ts`        |       |
| `src/audio/audioContextResume.ts`             |       |
| `src/audio/capture-processor.test.ts`         |       |
| `src/audio/capture-processor.ts`              |       |
| `src/audio/micSessionControl.test.ts`         |       |
| `src/audio/micSessionControl.ts`              |       |
| `src/audio/micStream.test.ts`                 |       |
| `src/audio/micStream.ts`                      |       |
| `src/audio/micWindowHandler.test.ts`          |       |
| `src/audio/micWindowHandler.ts`               |       |
| `src/audio/pitchDetector.test.ts`             |       |
| `src/audio/pitchDetector.ts`                  |       |
| `src/audio/pitchGate.test.ts`                 |       |
| `src/audio/pitchGate.ts`                      |       |
| `src/audio/pitchState.ts`                     |       |
| `src/audio/referenceTone.test.ts`             |       |
| `src/audio/referenceTone.ts`                  |       |
| `src/audio/useMicControls.test.ts`            |       |
| `src/audio/useMicControls.ts`                 |       |
| `src/audio/usePitch.test.ts`                  |       |
| `src/audio/usePitch.ts`                       |       |
| `src/audio/worklet-types.d.ts`                |       |
| `src/components/AboutSheet.test.tsx`          |       |
| `src/components/AboutSheet.tsx`               |       |
| `src/components/CustomTuningList.test.tsx`    |       |
| `src/components/CustomTuningList.tsx`         |       |
| `src/components/CustomTuningRow.tsx`          |       |
| `src/components/InstallHint.test.tsx`         |       |
| `src/components/InstallHint.tsx`              |       |
| `src/components/NotePicker.test.tsx`          |       |
| `src/components/NotePicker.tsx`               |       |
| `src/components/PresetPicker.test.tsx`        |       |
| `src/components/PresetPicker.tsx`             |       |
| `src/components/Sheet.test.tsx`               |       |
| `src/components/Sheet.tsx`                    |       |
| `src/components/StringList.test.tsx`          |       |
| `src/components/StringList.tsx`               |       |
| `src/components/SwipeableRow.test.tsx`        |       |
| `src/components/SwipeableRow.tsx`             |       |
| `src/components/TextField.test.tsx`           |       |
| `src/components/TextField.tsx`                |       |
| `src/components/TuneDirectionHint.test.tsx`   |       |
| `src/components/TuneDirectionHint.tsx`        |       |
| `src/components/TunerGauge.test.tsx`          |       |
| `src/components/TunerGauge.tsx`               |       |
| `src/components/reviveOverflowScroll.test.ts` |       |
| `src/components/reviveOverflowScroll.ts`      |       |
| `src/components/stringRailOverflow.test.ts`   |       |
| `src/components/stringRailOverflow.ts`        |       |
| `src/components/strings.ts`                   |       |
| `src/components/useLockBodyScroll.test.ts`    |       |
| `src/components/useLockBodyScroll.ts`         |       |
| `src/components/useStringRailScroll.test.tsx` |       |
| `src/components/useStringRailScroll.ts`       |       |
| `src/components/useSwipeOffset.ts`            |       |
| `src/core/music/cents.test.ts`                |       |
| `src/core/music/cents.ts`                     |       |
| `src/core/music/frequency.test.ts`            |       |
| `src/core/music/frequency.ts`                 |       |
| `src/core/music/index.ts`                     |       |
| `src/core/music/nearestNote.test.ts`          |       |
| `src/core/music/nearestNote.ts`               |       |
| `src/core/music/notes.test.ts`                |       |
| `src/core/music/notes.ts`                     |       |
| `src/core/signal/pitchStabilizer.test.ts`     |       |
| `src/core/signal/pitchStabilizer.ts`          |       |
| `src/core/signal/pluckedTone.test.ts`         |       |
| `src/core/signal/pluckedTone.ts`              |       |
| `src/core/tunings/analyzer.test.ts`           |       |
| `src/core/tunings/analyzer.ts`                |       |
| `src/core/tunings/custom.test.ts`             |       |
| `src/core/tunings/custom.ts`                  |       |
| `src/core/tunings/index.ts`                   |       |
| `src/core/tunings/presets.test.ts`            |       |
| `src/core/tunings/presets.ts`                 |       |
| `src/core/tunings/types.test.ts`              |       |
| `src/core/tunings/types.ts`                   |       |
| `src/index.css`                               |       |
| `src/main.tsx`                                |       |
| `src/platform/appVersion.test.ts`             |       |
| `src/platform/appVersion.ts`                  |       |
| `src/platform/audioSession.test.ts`           |       |
| `src/platform/audioSession.ts`                |       |
| `src/platform/runtime.test.ts`                |       |
| `src/platform/runtime.ts`                     |       |
| `src/quality/edgeCaseCoverage.ts`             |       |
| `src/quality/edgeCases.test.ts`               |       |
| `src/quality/edgeCases.ts`                    |       |
| `src/state/appState.test.ts`                  |       |
| `src/state/appState.ts`                       |       |
| `src/state/customTuningActions.test.ts`       |       |
| `src/state/customTuningActions.ts`            |       |
| `src/state/tuningDefaults.test.ts`            |       |
| `src/state/tuningDefaults.ts`                 |       |
| `src/state/useSavedTunings.test.ts`           |       |
| `src/state/useSavedTunings.ts`                |       |
| `src/state/useStableAnalysis.test.ts`         |       |
| `src/state/useStableAnalysis.ts`              |       |
| `src/storage/customTuningsStore.test.ts`      |       |
| `src/storage/customTuningsStore.ts`           |       |
| `src/test/fakeAudioContext.ts`                |       |
| `src/test/memoryStorage.ts`                   |       |
| `src/test/vitest.setup.ts`                    |       |
| `src/vite-env.d.ts`                           |       |

### E2E

| Path                            | Notes |
| ------------------------------- | ----- |
| `e2e/about.spec.ts`             |       |
| `e2e/background-resume.spec.ts` |       |
| `e2e/custom-tuning.spec.ts`     |       |
| `e2e/helpers.ts`                |       |
| `e2e/landing.spec.ts`           |       |
| `e2e/mic-permissions.spec.ts`   |       |
| `e2e/reference-tone.spec.ts`    |       |
| `e2e/smoke.spec.ts`             |       |
| `e2e/stop-tuning.spec.ts`       |       |
| `e2e/store/marketingFrame.ts`   |       |
| `e2e/store/screenshots.spec.ts` |       |
| `e2e/string-list.spec.ts`       |       |
| `e2e/tuner.spec.ts`             |       |
| `e2e/ukulele.spec.ts`           |       |

### Scripts

| Path                                | Notes |
| ----------------------------------- | ----- |
| `scripts/appReleaseVersion.test.ts` |       |
| `scripts/appReleaseVersion.ts`      |       |
| `scripts/bumpAppVersion.ts`         |       |
| `scripts/check-knowledge.mjs`       |       |
| `scripts/generate-icons.mjs`        |       |
| `scripts/native-e2e.sh`             |       |
| `scripts/refresh-file-index.mjs`    |       |
| `scripts/stampNativeVersion.ts`     |       |
| `scripts/sync-knowledge-wiki.mjs`   |       |
| `scripts/sync-notion-wiki.mjs`      |       |

### Workflows

| Path                                   | Notes |
| -------------------------------------- | ----- |
| `.github/workflows/ci.yml`             |       |
| `.github/workflows/deploy.yml`         |       |
| `.github/workflows/knowledge-wiki.yml` |       |

### Knowledge tree

| Path                                         | Notes |
| -------------------------------------------- | ----- |
| `docs/knowledge/AGENT_PROTOCOL.md`           |       |
| `docs/knowledge/CATALOG.md`                  |       |
| `docs/knowledge/INDEX.md`                    |       |
| `docs/knowledge/areas/architecture.md`       |       |
| `docs/knowledge/areas/audio.md`              |       |
| `docs/knowledge/areas/ci-cd.md`              |       |
| `docs/knowledge/areas/components.md`         |       |
| `docs/knowledge/areas/core-music.md`         |       |
| `docs/knowledge/areas/core-signal.md`        |       |
| `docs/knowledge/areas/core-tunings.md`       |       |
| `docs/knowledge/areas/file-index.md`         |       |
| `docs/knowledge/areas/native-shell.md`       |       |
| `docs/knowledge/areas/patterns-and-rules.md` |       |
| `docs/knowledge/areas/sdd-tdd.md`            |       |
| `docs/knowledge/areas/state.md`              |       |
| `docs/knowledge/areas/storage.md`            |       |
| `docs/knowledge/areas/testing.md`            |       |
| `docs/knowledge/areas/tooling.md`            |       |
| `docs/knowledge/graph.json`                  |       |

### Root / agent entry

| Path                              | Notes |
| --------------------------------- | ----- |
| `package.json`                    |       |
| `vite.config.ts`                  |       |
| `playwright.config.ts`            |       |
| `eslint.config.js`                |       |
| `tsconfig.json`                   |       |
| `tsconfig.app.json`               |       |
| `tsconfig.node.json`              |       |
| `index.html`                      |       |
| `AGENTS.md`                       |       |
| `CLAUDE.md`                       |       |
| `llms.txt`                        |       |
| `README.md`                       |       |
| `.github/copilot-instructions.md` |       |

<!-- AUTO:FILE-INDEX:END -->
