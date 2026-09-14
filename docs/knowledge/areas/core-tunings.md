# Core: tunings

Tags: `tuning`, `preset`, `analyzer`, `custom`, `draft`, `chromatic`  
Path: `src/core/tunings/`

## Role

Tuning model, built-in presets, nearest-string / chromatic analysis, custom/draft
predicates.

## Types (`types.ts`)

- `Instrument = 'guitar' | 'bass'`
- `InstrumentString = { pitch: Pitch }`
- `Tuning = { id, name, instrument, strings }`

## Modules

| File          | Key API                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `presets.ts`  | `PRESET_TUNINGS`, `DEFAULT_TUNING_ID` (`guitar-standard`). Guitar includes 6/7/8-string standard; bass 4/5-string.          |
| `analyzer.ts` | `IN_TUNE_CENTS = 5`, `analyze`, `analyzeString`, `analyzeChromatic`, `TuneDirection`, `StringAnalysis`, `ChromaticAnalysis` |
| `custom.ts`   | `DRAFT_TUNING_ID`, `isSavedCustomTuning`, `isDraftTuning`, `isUnmodifiedPreset`, `belongsInMyTunings`, `appearsInPicker`    |
| `index.ts`    | barrel                                                                                                                      |

## Analyzer behavior

- Auto: nearest target string on log-frequency scale → cents + direction.
- Manual: fixed string index via `analyzeString`.
- Chromatic: nearest 12-TET note via `nearestPitch` → `ChromaticAnalysis` (no tuning).
- Direction: `tighten` (flat) / `loosen` (sharp) / `in-tune` (|¢| ≤ 5).

## Custom / draft rules

- Edits flip id to `custom-draft` until saved (state layer).
- `belongsInMyTunings` / `appearsInPicker` gate what shows in PresetPicker lists.

## Open when

New presets, in-tune threshold, string matching, chromatic nearest-note policy,
draft/My tunings membership. Storage and state depend on these predicates — keep
them in sync.

## See also

- [core-music.md](core-music.md) · [storage.md](storage.md) · [state.md](state.md) · [components.md](components.md)
