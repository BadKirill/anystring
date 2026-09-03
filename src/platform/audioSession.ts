export type AudioSessionMode = 'playback' | 'capture'

type WebAudioSessionType =
  'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record'

let mode: AudioSessionMode = 'playback'

function webTypeFor(next: AudioSessionMode): WebAudioSessionType {
  return next === 'capture' ? 'play-and-record' : 'playback'
}

function applyWebAudioSessionType(): void {
  const session = navigator.audioSession
  if (!session) {
    return
  }
  session.type = webTypeFor(mode)
}

export function setAudioSessionMode(next: AudioSessionMode): void {
  mode = next
  applyWebAudioSessionType()
}

export function reassertAudioSession(): void {
  applyWebAudioSessionType()
}
