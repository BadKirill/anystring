# Core: signal

Tags: `stabilizer`, `pluck`, `signal`, `jitter`  
Path: `src/core/signal/`

## Role

Pure signal helpers: steady the needle for display, synthesize plucked tones for
reference audio and tests.

## Modules

| File                 | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `pitchStabilizer.ts` | Pure state machine: lock, attack damp, decay hold, unlock |
| `pluckVoice.ts`      | Plucked and bowed partial recipes for every instrument    |
| `pluckedTone.ts`     | `synthesizePluck` + `normalizePluck`                      |
| `*.test.ts`          | Lock/unlock behavior; pluck energy shape                  |

## Stabilizer contracts (`pitchStabilizer.ts`)

| Constant                 | Value               | Meaning                               |
| ------------------------ | ------------------- | ------------------------------------- |
| `LOCK_READINGS`          | 2                   | Consecutive in-tune readings to latch |
| `ATTACK_MS`              | 200                 | Attack window for sharp damping       |
| `UNLOCK_CENTS`           | 14                  | Jump that breaks latch                |
| `DECAY_HOLD_MS`          | 450                 | Hold last reading after signal loss   |
| `SHARP_ATTACK_THRESHOLD` | 6                   | Cents above which attack damp applies |
| `SHARP_DAMPING`          | 0.35                | Multiply sharp cents during attack    |
| `MIN_CLARITY`            | 0.5                 | Ignore weaker updates                 |
| in-tune                  | `IN_TUNE_CENTS` (5) | From analyzer                         |

API: `initialPitchStabilizerState`, `stabilizePitchDisplay(input) → { cents, direction, state }`.

Wired from `src/state/useStableAnalysis.ts` (not from audio directly).

## Pluck synth

`synthesizePluck(frequency, sampleRate, durationSec, voice)` + `normalizePluck`.
Each `PluckVoice` sets partial slope, body peaks, attack, and ring time.
Guitar, bass, and ukulele decay like a pluck. Violin, viola, cello, and
double bass hold a bow and release at the end. The first partial is the
written frequency, so the preview stays on the note. Used by
`src/audio/referenceTone.ts`.

## Open when

Needle jitter, false unlocks, attack sharpness, reference/test tone synthesis.

## See also

- [core-tunings.md](core-tunings.md) — `IN_TUNE_CENTS` / direction
- [state.md](state.md) — `useStableAnalysis`
- [audio.md](audio.md) — reference tone + raw pitch
