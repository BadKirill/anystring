# SDD + TDD, Linus taste, SOLID

Tags: `sdd`, `tdd`, `solid`, `linus`, `spec`, `taste`  
Sources: `AGENTS.md`, `.cursor/rules/sdd-tdd.mdc`

**Mandatory for every coding agent** (Cursor, Codex, Claude, Copilot, others).
Do not start implementation until the spec is encoded in types and a failing test.

## Loop (do this, in order)

```
1. Specify   — types, invariants, inputs/outputs, failure modes
2. Red       — one failing test that encodes the spec
3. Green     — smallest change that makes the test pass
4. Refactor  — remove special cases; keep SOLID; tests stay green
5. Check     — npm run check must pass
```

Skip the loop only for: docs/config-only, copy tweaks, or ESLint/Prettier-only.
A spike may explore, but it is thrown away or rewritten through this loop before merge.

## SDD — specification first

The spec is not a chat promise. It lives in the repo:

| Spec lives in                               | Use it for                                   |
| ------------------------------------------- | -------------------------------------------- |
| TypeScript types / function signatures      | Shape of data and public contracts           |
| Colocated Vitest (`foo.ts` + `foo.test.ts`) | Concrete examples and edge cases             |
| Playwright / Maestro                        | User-visible flow (permissions, start/stop)  |
| This knowledge tree                         | Invariants (mic filters off, window 8192, …) |

Before writing production code, name:

- What is true after the change (behavior, not “refactored X”).
- What must not change (storage keys, UI copy, audio invariants).
- Failure modes (deny mic, silence, jump in Hz).

If you cannot write a test for it, you do not have a spec yet — shrink the change.

## TDD — test first

- **Red:** add or extend a test; run it; confirm it fails for the right reason.
- **Green:** implement only what the test requires.
- **Refactor:** clean structure without adding behavior.

Rules:

- Every `src/core/` change is TDD. Colocated tests are not optional.
- Pure logic in `src/audio/` / `src/state/` / `src/storage/` gets a unit test first.
- User-visible flows get Playwright (web) or Maestro (native shell) coverage
  when the behavior is new or the existing e2e would lie.
- Tests assert **behavior** (F1 detection, nearest string, migrate v1→v2). Skip
  trivial “it is a function” assertions.
- Do not write the implementation and then “add tests to match.” If tests were
  written after the fact, delete the implementation path and redo Red→Green.

## Linus taste — good code, not clever code

Linus Torvalds’ bar, applied here:

1. **Good taste** — special cases mean the data is wrong. Prefer a shape where
   the edge case disappears (his linked-list “remove without if” standard).
2. **Data first** — design types and relationships before algorithms.
   `Pitch`, `Tuning`, `PitchState` are the design; the functions follow.
3. **Never break userspace** — do not break existing user-visible behavior,
   storage keys, or audio invariants unless the change _is_ that break and the
   spec says so.
4. **Simplicity** — no premature abstraction, no framework for one call site,
   no comment that apologizes for a hack. Rewrite instead.
5. **Fix the cause** — no workaround that papers over a real bug.
6. **Small patches** — one concern; no drive-by refactors.
7. **Indentation / complexity** — already ESLint: depth ≤ 3, complexity ≤ 10,
   function ≤ 50 lines. If the linter complains, the design is wrong.

Refuse sloppy patches: extra flags, nested `if`s for one-offs, `any`, `!`,
`@ts-ignore`, commented-out code, or “we’ll test it later.”

## SOLID — mapped to this repo

Do **not** introduce class hierarchies to “do SOLID.” Prefer functions + types.

| Principle                   | In this codebase                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **S** Single responsibility | One module/function, one job. Gauge does not detect pitch.                                                    |
| **O** Open/closed           | Add a function/module (new analyzer, new screen) rather than bloating a god file.                             |
| **L** Liskov                | Adapters honor their contract (`startMicSession`, storage load/save). A substitute must not surprise callers. |
| **I** Interface segregation | Small types (`Pitch`, `Tuning`, `PitchState`). No kitchen-sink interfaces.                                    |
| **D** Dependency inversion  | `src/core/` depends on nothing platform-shaped. Audio/UI/storage depend on core.                              |

Layer table: [architecture.md](architecture.md).

## What “done” means

- Spec is visible in types + tests.
- Tests were red, then green.
- No new special cases that a better type would remove.
- `npm run check` passes.
- If structure/contracts changed: local knowledge updated + `knowledge:check`.

## Open when

Any code change: feature, bugfix, refactor, audio threshold, UI flow.

## See also

- [patterns-and-rules.md](patterns-and-rules.md) · [testing.md](testing.md) ·
  [architecture.md](architecture.md) · [INDEX.md](../INDEX.md)
