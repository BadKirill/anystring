# Testing

Tags: `test`, `vitest`, `playwright`, `e2e`, `maestro`

## Unit (Vitest)

TDD is mandatory for code changes ([sdd-tdd.md](sdd-tdd.md)): failing test first,
then the smallest implementation. Do not write production code and match tests after.

- Command: `npm run test` (included in `npm run check`)
- Config: `vite.config.ts` excludes `e2e/**` from Vitest
- Rule: every `src/core/` module has colocated `*.test.ts`
- Also: `src/audio/pitchDetector.test.ts`, `src/storage/customTuningsStore.test.ts`
- Prefer behavior tests (F1 detection, analyzer nearest string, storage migrate)

## E2E (Playwright — web / deterministic audio)

| File                            | Focus                                                                   |
| ------------------------------- | ----------------------------------------------------------------------- |
| `e2e/helpers.ts`                | Mic stub/deny/missing/unavailable, `spyReferenceTone`, storage helpers  |
| `e2e/smoke.spec.ts`             | Deployed/live smoke                                                     |
| `e2e/tuner.spec.ts`             | Strings + chromatic + low E2 with stub mic                              |
| `e2e/mic-permissions.spec.ts`   | Denied / missing / unavailable copy + retry recover                     |
| `e2e/reference-tone.spec.ts`    | String tap + note picker buffer plays; listening stays up               |
| `e2e/background-resume.spec.ts` | Tone + mic recovery after a 10-minute background (`stubLongBackground`) |
| `e2e/custom-tuning.spec.ts`     | Edit/save custom                                                        |
| `e2e/string-list.spec.ts`       | One-row string rail + overflow slider                                   |
| `e2e/stop-tuning.spec.ts`       | Stop listening                                                          |
| `e2e/store/screenshots.spec.ts` | Store listing PNGs (not in default `test:e2e`)                          |

Commands:

- Local full: `npm run test:e2e` (`testIgnore: **/store/**`)
- Live smoke: `npm run test:e2e:live` (or `PLAYWRIGHT_BASE_URL=...`)
- Store screenshots: `npm run screenshots:store` → `store/screenshots/{ios,android}/`
  (`playwright.store.config.ts`: iPhone 6.7" 430×932@3x, Android 432×768@2.5 → 1080×1920)

## Native E2E (Maestro)

Chosen stack addition (see `docs/DEVELOPMENT_PLAN.md`): **Maestro** YAML against
Capacitor shells. Covers OS mic permission UX and UI smoke — not deterministic
pitch (simulators lack a reliable instrument path).

| Path                              | Focus                                 |
| --------------------------------- | ------------------------------------- |
| `.maestro/permissions-allow.yaml` | Grant mic → `Stop` visible            |
| `.maestro/permissions-deny.yaml`  | Deny mic → denied error copy          |
| `.maestro/reference-tap.yaml`     | String tap + tabs/picker + start/stop |
| `.maestro/screenshots.yaml`       | Optional native backup shots          |
| `scripts/native-e2e.sh`           | Sync, build, install, run Maestro     |

Commands: `npm run test:e2e:native` (`ios` \| `android` \| `all`),
`npm run cap:build:ios-sim`, `npm run cap:build:android-debug`.

Requires Maestro CLI, a booted iOS Simulator and/or Android emulator, JDK 21 for
Android. Real WKWebView mic samples on a physical iPhone remain a manual check
([native-shell.md](native-shell.md)).

`permissions-deny.yaml` runs on **Android only** (`test:e2e:native android` /
`all`): taps the system “Don’t allow” control
(`permission_deny_button`) and asserts the app does **not** enter listening.
iOS Simulator still feeds `getUserMedia` when mic is “denied”. Exact denied
copy strings stay Playwright assertions (`e2e/mic-permissions.spec.ts`).

## Patterns

- Mic stubbed with oscillators before `page.goto` so worklet→pitch→UI is deterministic.
- Reference tones counted via `AudioBufferSourceNode.start` spy (oscillator stubs do not count).
- First mic prompt is the **OS** dialog — no in-app pre-permission screen.
- E2E / test files relax max-lines / cognitive complexity in ESLint.

## Open when

Adding coverage for new flows, flaky UI, changing detection thresholds that
break stubbed frequencies, or native permission/shell regressions.

## See also

- [sdd-tdd.md](sdd-tdd.md) · [audio.md](audio.md) · [native-shell.md](native-shell.md) ·
  [ci-cd.md](ci-cd.md) · [patterns-and-rules.md](patterns-and-rules.md)
