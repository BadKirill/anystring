---
description: Code style and quality rules for AnyTune
alwaysApply: true
---

# AnyTune code style

Human-readable, simple code is the top priority. Enforced by `npm run check`
(lint + format check + typecheck + tests) — it must pass before any task is done.

Process: **SDD + TDD**, Linus taste, SOLID — see `.cursor/rules/sdd-tdd.mdc` and
`docs/knowledge/areas/sdd-tdd.md`. Spec in types → failing test → implement →
refactor. Do not write production code first and match tests after.

## Structure

- `src/core/` is pure TypeScript: no React, no DOM, no browser globals, no imports
  from `src/audio`, `src/components`, `src/state`, or `src/storage`. ESLint enforces
  this. It keeps the core portable to React Native.
- Every module in `src/core/` has unit tests (Vitest) next to it: `foo.ts` + `foo.test.ts`.
- Platform-facing code (mic, storage) lives behind small interfaces so it can be swapped.

## Style

- Functions are small and single-purpose: max 50 lines, cyclomatic complexity <= 10,
  cognitive complexity <= 10, nesting depth <= 3 (all ESLint errors, do not disable).
- No `any`, no non-null assertions, no `@ts-ignore`. Model uncertainty in types.
- Prefer pure functions and plain data over classes and mutation.
- Name things by domain meaning (`centsBetween`, `frequencyToMidiFloat`), not
  implementation (`calc`, `helper`, `data`).
- Comments explain _why_, never _what_ the code already says.
- Formatting is Prettier's job — never hand-format, run `npm run format`.

## Audio-specific

- Never enable `echoCancellation`, `noiseSuppression`, or `autoGainControl` on the
  microphone stream — they destroy low-frequency content needed for bass tuning.
- Pitch-detection window stays at 8192 samples unless real-device testing justifies
  a change (needed for ~43 Hz low-bass detection).
