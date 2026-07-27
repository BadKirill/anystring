# Audio pipeline

Tags: `mic`, `worklet`, `pitchy`, `agc`, `reference-tone`  
Path: `src/audio/`

## Hard constraints

- `getUserMedia` audio: **echoCancellation / noiseSuppression / autoGainControl = false**
- Analysis window: **8192** samples (`capture-processor.ts`, pitchy)
- Usable band: **25–1000 Hz** (`MIN_FREQUENCY_HZ` / `MAX_FREQUENCY_HZ`)

## Clarity gate (`minClarityFor`)

| Frequency   | Min clarity |
| ----------- | ----------- |
| &lt; 60 Hz  | 0.82        |
| &lt; 100 Hz | 0.86        |
| else        | 0.90        |

Bass fundamentals get a slightly lower bar; still reject weak detections.

## Pipeline modules

| File                   | Role                                                                       |
| ---------------------- | -------------------------------------------------------------------------- |
| `micStream.ts`         | Start session, typed `MicError` / `MicStreamError`, AudioContext + worklet |
| `capture-processor.ts` | Ring buffer; post Float32 window every ~4096 frames (~85 ms @ 48 kHz)      |
| `pitchDetector.ts`     | `detectPitch`, `minClarityFor`, `frequencyJumpCents`                       |
| `micWindowHandler.ts`  | Median of last 5; reject jumps &gt; 150¢ unless stable                     |
| `micSessionControl.ts` | `beginMicSession` / `stopMicSession` (status + teardown)                   |
| `useMicControls.ts`    | Hook wiring start/stop + resume                                            |
| `usePitch.ts`          | Public `{ status, error, frequency, clarity, start, stop }`                |
| `pitchState.ts`        | `PitchStatus`, `PitchState`                                                |
| `pitchGate.ts`         | Suppress detection while reference tone plays                              |
| `referenceTone.ts`     | Plucked reference note (uses `core/signal/pluckedTone`)                    |
| `appResume.ts`         | Visibility / pageshow resume handlers                                      |
| `worklet-types.d.ts`   | Worklet typings                                                            |

## Session lifecycle

`idle` → `starting` (`beginMicSession`) → `listening` | `error`  
`stopMicSession` clears refs, stops worklet/tracks, returns `idle`.

On audio graph end or a suspended AudioContext that cannot resume, mic stream
schedules `restart` via timeout if still active.

`useMicControls`: Start always rebuilds the session (dead/suspended sessions can
leave a non-null ref). App resume restarts only while listening; unmount stop is
separate from resume registration so dependency churn does not kill the mic.

`referenceTone.warmReferenceAudio` rebuilds the shared context if resume fails
after long idle.

## iOS ring/silent switch

WKWebView defaults Web Audio to an Ambient session, so the hardware ring/silent
switch mutes reference tones even when `AudioContext.state === "running"`.

Fix (web only): `src/platform/audioSession.ts` sets
`navigator.audioSession.type` to `playback` before each tone, or
`play-and-record` while the mic is open (Web Audio Session API, iOS 17+).

Do **not** reconfigure the app `AVAudioSession` from JS/native around tones —
that interrupts WebKit's separate session and can silence output entirely
(observed on iOS 26). The Capacitor `AudioSession` plugin is a no-op stub.

| Trigger                      | Call                              |
| ---------------------------- | --------------------------------- |
| Before every tone (`warm…`)  | `reassertAudioSession()`          |
| Mic session listening        | `setAudioSessionMode('capture')`  |
| Mic session stopped / failed | `setAudioSessionMode('playback')` |

## Patterns

- Worklet posts windows; main thread detects pitch — no UI here.
- Components call `state.pitch.start/stop` only.
- Tests: `pitchDetector.test.ts` with synthesized plucks including F1.

## Open when

Mic permission UX, detection quality, window size, AGC mistakes, start/stop bugs,
reference tone interference with listening, silent-switch playback on iOS.

## See also

- [core-signal.md](core-signal.md) — pluck synth + display stabilizer (via state)
- [core-music.md](core-music.md) — Hz / cents math
- [state.md](state.md) — consumes `usePitch`
- [testing.md](testing.md) — oscillator mic stub
- [native-shell.md](native-shell.md) — the Swift side of the audio session
