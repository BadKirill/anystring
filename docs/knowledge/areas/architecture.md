# Architecture & data flow

Tags: `architecture`, `layers`, `data-flow`

## Intent

One portable domain core + thin platform shells. UI and mic can be swapped;
music/tuning math stays pure.

## Data flow

```
getUserMedia (AGC/NS/EC OFF)
  → AudioWorklet ring buffer (WINDOW 8192, post ~85ms)
  → detectPitch(pitchy MPM) + clarity gate
  → median / jump filter (micWindowHandler)
  → usePitch → useTunerState
  → screen strings: analyze(frequency, tuning) or analyzeString(manual)
  → screen chromatic: analyzeChromatic(frequency)  // nearest 12-TET note
  → stabilizePitchDisplay (attack lock, decay hold)
  → TunerGauge / TuneDirectionHint / (StringList on strings screen)
```

Parallel path: presets + string edits → `Tuning` → storage (`active` + custom list)
→ string analyzer. Chromatic ignores active tuning for targeting.

## How to change it

SDD + TDD, Linus taste, SOLID: [sdd-tdd.md](sdd-tdd.md). Specify the contract in
types, prove it with a failing test, then implement. SOLID here is layer
boundaries and small functions — not class hierarchies.

## Layer contracts

| Layer              | May import                                        | Must not                                      |
| ------------------ | ------------------------------------------------- | --------------------------------------------- |
| `src/core/*`       | other core, nothing else                          | react, DOM, audio, components, state, storage |
| `src/audio/*`      | core/music, core/signal (as needed), browser APIs | components UI details                         |
| `src/storage/*`    | core/tunings, core/music types                    | React                                         |
| `src/state/*`      | audio hooks, core, storage                        | —                                             |
| `src/components/*` | core types/helpers, UI only                       | pitch detection internals                     |

## Entry points

- App bootstrap: `src/main.tsx` → `App.tsx`
- Screen state: `src/state/appState.ts` → `useTunerState` (`screen` tabs)
- Pitch pipeline: `src/audio/usePitch.ts`
- Domain barrel: `src/core/music`, `src/core/tunings`

## Related docs

- Plan / roadmap: `docs/DEVELOPMENT_PLAN.md` (steps 1–7 done; chromatic tab;
  8 Capacitor, 9 device)
- Agent workflow: `AGENTS.md`
- Patterns: [patterns-and-rules.md](patterns-and-rules.md)

## When to open source

Touch architecture only when changing layer boundaries, new top-level folders,
or the mic→UI pipeline shape. Prefer area pages for normal features.

## See also

- [sdd-tdd.md](sdd-tdd.md) · [patterns-and-rules.md](patterns-and-rules.md) ·
  [audio.md](audio.md) · [state.md](state.md) · [file-index.md](file-index.md)
