# Core: music

Tags: `music`, `midi`, `frequency`, `cents`, `notes`, `nearest`, `chromatic`  
Path: `src/core/music/`

## Role

Pure music math. No React/DOM. Barrel: `index.ts` re-exports notes, frequency,
cents, nearest note.

## Modules

| File             | Exports / purpose                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `notes.ts`       | `NOTE_NAMES`, `isNoteName`, `MIN_OCTAVE`/`MAX_OCTAVE` (0–6), `Pitch`, `pitchToMidi`, `midiToPitch`, `formatPitch`, `pitchesEqual` |
| `frequency.ts`   | `midiToFrequency`, `frequencyToMidiFloat`, `pitchToFrequency` (A4=440, MIDI 69)                                                   |
| `cents.ts`       | `centsBetween(actual, target)` — +sharp / −flat                                                                                   |
| `nearestNote.ts` | `nearestPitch(frequency)` — 12-TET round via float MIDI                                                                           |
| `*.test.ts`      | A4, E2, F1≈43.65, G#1, round-trips, nearest-note rounding                                                                         |

## Patterns

- Plain functions; constants for A4 and semitone math.
- `Pitch = { note, octave }`; MIDI C0 base used in conversions.
- Nearest-note math lives here; in-tune policy stays in tunings analyzer.

## Open when

Changing note naming, frequency formula, cents sign convention, nearest-note
rounding, or bass-range expectations. Callers: tunings analyzer, pitch detector
tests, UI labels.

## See also

- [core-tunings.md](core-tunings.md) · [audio.md](audio.md) · [components.md](components.md)
