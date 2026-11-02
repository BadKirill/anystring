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
| &lt; 60 Hz  | 0.88        |
| &lt; 100 Hz | 0.88        |
| else        | 0.90        |

## Amplitude gate (`minRmsFor`)

Quiet WKWebView hum (~40 Hz, high clarity, RMS about 0.0035) is rejected before
it can look like a low bass note. A phone mic delivers the bass low E quieter
than a guitar string, so the floor under 55 Hz sits just above that hum.

| Frequency  | Min RMS |
| ---------- | ------- |
| &lt; 55 Hz | 0.006   |
| &lt; 90 Hz | 0.008   |
| else       | 0.005   |

`detectPitch` also subtracts DC bias, and `micWindowHandler` waits for 3 agreeing
windows (~250 ms) before publishing a frequency so a single hum spike cannot flash.
One window that jumps more than 150 cents is ignored. A second such jump, or any
silent window, clears the history.
While a reference tone suppresses detection, the handler clears the published
frequency instead of leaving the previous reading on screen.

## Pipeline modules

| File                    | Role                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `micStream.ts`          | Start session, typed `MicError` / `MicStreamError`, AudioContext + worklet                                                                                                                 |
| `capture-processor.ts`  | Ring buffer; post Float32 window every ~4096 frames (~85 ms @ 48 kHz)                                                                                                                      |
| `pitchDetector.ts`      | `detectPitch`, `minClarityFor`, `frequencyJumpCents`                                                                                                                                       |
| `micWindowHandler.ts`   | Median of last 5; one jump &gt; 150¢ is ignored, a second jump or silence clears                                                                                                           |
| `micSessionControl.ts`  | `beginMicSession` / `stopMicSession` (status + teardown)                                                                                                                                   |
| `useMicControls.ts`     | Hook wiring start/stop + resume + autostart                                                                                                                                                |
| `autoStart.ts`          | `shouldAutoStart`: idle and not stopped by the user                                                                                                                                        |
| `usePitch.ts`           | Public `{ status, error, frequency, clarity, start, stop }`                                                                                                                                |
| `pitchState.ts`         | `PitchStatus`, `PitchState`                                                                                                                                                                |
| `pitchGate.ts`          | Suppress detection while reference tone plays                                                                                                                                              |
| `referenceTone.ts`      | Instrument preview; highpass is `REFERENCE_HIGHPASS_HZ` (20), below bass B0. A new note fades the previous one out over `REFERENCE_SWITCH_FADE_S` (30 ms) so a quick switch does not click |
| `appResume.ts`          | Visibility / pageshow resume handlers, reports `hiddenMs`                                                                                                                                  |
| `audioContextResume.ts` | Bounded `resume()` + `STALE_BACKGROUND_MS` rebuild threshold                                                                                                                               |
| `worklet-types.d.ts`    | Worklet typings                                                                                                                                                                            |

## Session lifecycle

`idle` → `starting` (`beginMicSession`) → `listening` | `error`  
`stopMicSession` clears refs, stops worklet/tracks, returns `idle`.

`beginMicSession` bumps a generation token so overlapping `getUserMedia`
promises cannot clobber a newer start (common when iOS suspends + resumes).
Failed starts clear `active` so visibility resume does not hammer the mic.
`setAudioSessionMode('capture')` runs **before** `getUserMedia`.

iOS always suspends `AudioContext` while backgrounded. That is **not** treated
as a dead stream: `watchContextSuspend` / track `ended` ignore events while
`document.visibilityState === 'hidden'`. On foreground, `resumeMicSession`
soft-resumes the existing context; only a failed resume rebuilds the session.

## Long background (10+ min)

The OS reclaims the audio hardware while the app idles in the background, and
the old graph never produces sound again — `resume()` may even resolve into a
`running` context that stays silent, or leave its promise pending forever.

- Every `resume()` goes through `resumeAudioContext` (1.5 s cap, returns whether
  the context actually runs). Nothing awaits a bare `AudioContext.resume()`.
- `appResume` measures `hiddenMs` (Infinity for bfcache restores) and passes it
  to handlers.
- Past `STALE_BACKGROUND_MS` (30 s) the graph is rebuilt, not resumed: the mic
  restarts via `beginMicSession`, and `referenceTone` marks its context stale so
  the next tap closes it and builds a fresh one under user activation.
- `releaseContext` closes the discarded context — Safari allows only a handful
  of live `AudioContext`s, so leaking them eventually kills playback outright.
- `MicSession.resume` fails fast when tracks are `ended` or `muted`, which is how
  iOS reports capture the system took away.

Platform note: measured on an Android emulator (Pixel 6 AVD) the graph survives
10 minutes of background untouched — the context stays `running`, `currentTime`
keeps advancing, tracks stay `live`, and both tone and mic work without a
rebuild. The teardown is a WKWebView behaviour, so on Android the rebuild is
precautionary (it still covers real devices, which cut background mic capture).

`useMicControls`: Start always rebuilds the session (dead/suspended sessions can
leave a non-null ref). Unmount stop is separate from resume registration so
dependency churn does not kill the mic. Unmount does not set `stoppedByUser`.

## Autostart

`shouldAutoStart({ status, stoppedByUser })` is true only when `status` is
`idle` and the user has not pressed Stop. On mount, `useMicControls` calls the
existing `start` once when that is true.

`stoppedByUser` is memory only. Stop sets it. The next page load starts again.
`starting`, `listening`, and `error` do not call `start` again, and there is no
retry timer. A denied or missing mic keeps the existing error copy and the
Start button. Background resume still restarts an active session and does not
restart one the user stopped.

Mic constraints and the 8192-sample window are unchanged.

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
