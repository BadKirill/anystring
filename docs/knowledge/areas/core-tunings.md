# Core: tunings

Tags: `tuning`, `preset`, `analyzer`, `custom`, `draft`, `chromatic`  
Path: `src/core/tunings/`

## Role

Tuning model, built-in presets, nearest-string / chromatic analysis, custom/draft
predicates.

## Types (`types.ts`)

- `Instrument = 'guitar' | 'bass' | 'ukulele' | 'violin' | 'viola' | 'cello' | 'double-bass'`
- `INSTRUMENTS` — picker order; `isInstrument` for storage validation
- `InstrumentString = { pitch: Pitch }`
- `Tuning = { id, name, instrument, strings }`

## Modules

| File          | Key API                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `presets.ts`  | `PRESET_TUNINGS`, `presetsFor`, `toggleExpandedInstruments`, `DEFAULT_TUNING_ID` (`guitar-standard`). Picker order is `INSTRUMENTS`. |
| `analyzer.ts` | `IN_TUNE_CENTS = 5`, `analyze`, `analyzeString`, `analyzeChromatic`, `TuneDirection`, `StringAnalysis`, `ChromaticAnalysis`          |
| `custom.ts`   | `DRAFT_TUNING_ID`, `isSavedCustomTuning`, `isDraftTuning`, `isUnmodifiedPreset`, `belongsInMyTunings`, `appearsInPicker`             |
| `index.ts`    | barrel                                                                                                                               |

Built-in presets, low string to high:

- Guitar — 6/7/8-string, Drop D, half-step down, Drop C#, Drop C
- Bass — 4-string, Drop D, 5-string
- Ukulele — High G, Low G, D tuning, Baritone, Open C
- Violin — standard GDAE, Cross A, Sawmill, D modal, High bass, G modal, Calico
- Viola — standard CGDA, five-string, violin pitch, Cross D-A
- Cello — standard CGDA, five-string, Bach Suite V (CGDG), Kodaly
- Double bass — orchestral EADG, solo, five-string low B, low C, fifths, Drop D

## Analyzer behavior

- Auto: nearest target string on log-frequency scale → cents + direction.
- Reentrant ukulele High G: G4 matches string 0, not A4.
- Violin D modal has D3, D4, and D5; each matches its own string.
- Every preset string stays inside the 25–1000 Hz detection band (violin E5 through double-bass B0 / C1).
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
