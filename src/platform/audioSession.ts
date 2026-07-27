/** `capture` keeps the microphone input open; `playback` is output only. */
export type AudioSessionMode = 'playback' | 'capture'

type WebAudioSessionType =
  'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record'

let mode: AudioSessionMode = 'playback'

function webTypeFor(next: AudioSessionMode): WebAudioSessionType {
  return next === 'capture' ? 'play-and-record' : 'playback'
}

/**
 * Declares intent via the Web Audio Session API (Safari / iOS 17+).
 *
 * WKWebView defaults to Ambient, which the ring/silent switch mutes even when
 * AudioContext looks healthy. Setting `playback` is the supported fix.
 *
 * Do not also call into the app AVAudioSession from JS before each tone: that
 * interrupts WebKit's separate session and can silence output entirely (iOS 26).
 */
function applyWebAudioSessionType(): void {
  const session = navigator.audioSession
  if (!session) {
    return
  }
  session.type = webTypeFor(mode)
}

/**
 * Switches between output-only and mic capture for the web audio session type.
 * No-op on browsers without `navigator.audioSession`.
 */
export function setAudioSessionMode(next: AudioSessionMode): void {
  mode = next
  applyWebAudioSessionType()
}

/**
 * Re-arms audible Web Audio before a reference tone. Safe to call repeatedly.
 */
export function reassertAudioSession(): void {
  applyWebAudioSessionType()
}
