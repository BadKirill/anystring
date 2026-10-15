# State

Tags: `state`, `hooks`, `useTunerState`, `chromatic`, `screen`  
Path: `src/state/`

## Role

Compose tuner screen state without Redux/Zustand. Single hook surface for `App`.

## Modules

| File                     | Role                                                                   |
| ------------------------ | ---------------------------------------------------------------------- |
| `appState.ts`            | `useTunerState`, `TunerState`, screen tabs, draft edit, analysis route |
| `useUsageTelemetry.ts`   | Anonymous events + review prompt after in-tune sessions                |
| `useSavedTunings.ts`     | Custom list, picker merge, save/delete/rename                          |
| `useStableAnalysis.ts`   | Stabilize string analysis; chromatic uses passthrough (live cents)     |
| `useStringLock.ts`       | Session checkmarks and the in-tune haptic edge                         |
| `customTuningActions.ts` | Factories: save draft / delete / rename                                |
| `tuningDefaults.ts`      | `defaultTuning()` from presets                                         |

## `TunerState` surface

- Data: `screen` (`strings` \| `chromatic`), `tuning`, `pickerTunings`,
  `tuningsRevision`, `manualStringIndex`, `analysis` (`DisplayAnalysis`),
  `checkedStrings`, `pitch`
- Actions: `setScreen`, `selectTuning`, `selectString`, `editString`, `saveDraft`,
  `deleteCustom`, `renameCustom`, `refreshMyTunings`

## Analysis routing

```
frequency + screen + tuning + manualStringIndex
  → null frequency? null
  → screen chromatic? { kind: 'chromatic', ...analyzeChromatic(f) }
  → manual null? { kind: 'string', ...analyze(f, tuning) }
  → else { kind: 'string', ...analyzeString(f, tuning, index) }
  → useStableAnalysis(..., scope=…, mode=`passthrough` on chromatic | `stabilize` on strings)
```

Scope reset clears stabilizer latch when screen / tuning / mode changes.
Screen mode is session-only (not persisted).

## String lock

`useStringLock` steps `stepStringLock` from the **displayed** analysis, after
`useStableAnalysis`. In tune is `direction === 'in-tune'`
(`|cents| ≤ IN_TUNE_CENTS`). There is no second threshold.

A check means the string reached in tune during this sitting. It stays after
the note leaves. The haptic fires on the rising edge only: once when the
analyzed string enters in tune, not again while that hold continues, and again
only after the displayed direction leaves in tune. The platform pulse runs
once per step, not per render.

The tuning key is `tuning.id` plus the MIDI of every string. A preset change
or a draft edit clears the checks. Nothing is written to `localStorage`.
Chromatic does not add a check or pulse. A null string index — including a
reference tone the pitch gate has blanked — releases the hold and does not
pulse or mark a string. Only `stringIndex` from that analysis is checked.

## Draft lifecycle

1. `editString` → `withEditedString`: if pitch changed, set `id = custom-draft`,
   name `Custom` (keep name if already draft).
2. `saveDraft(name)` (via saved-tunings actions) persists through storage and
   selects the saved tuning.
3. `selectTuning` writes active tuning to storage and clears manual string.

## Patterns

- Hook composition only — no global store.
- Storage + core predicates stay out of components.

## Open when

Screen tabs, mode switching, draft lifecycle, picker contents, analysis wiring.

## See also

- [audio.md](audio.md) — `usePitch`
- [core-tunings.md](core-tunings.md) — analyze / chromatic / draft ids
- [core-signal.md](core-signal.md) — stabilizer
- [storage.md](storage.md) — persistence
- [components.md](components.md) — consumers
