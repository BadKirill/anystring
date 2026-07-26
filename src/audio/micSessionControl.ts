import type { Dispatch, SetStateAction } from 'react'

import { setAudioSessionMode } from '../platform/audioSession'
import { MicStreamError, startMicSession, type MicSession } from './micStream'
import type { PitchState } from './pitchState'

const IDLE_STATE: PitchState = {
  status: 'idle',
  error: null,
  frequency: null,
  clarity: null,
}

interface SessionRefs {
  active: { current: boolean }
  session: { current: MicSession | null }
  recent: { current: number[] }
}

export function beginMicSession(
  refs: SessionRefs,
  setState: Dispatch<SetStateAction<PitchState>>,
  handleWindow: (samples: Float32Array, sampleRate: number) => void,
  restart: () => void,
): void {
  if (!refs.active.current) {
    return
  }
  refs.recent.current = []
  refs.session.current?.stop()
  refs.session.current = null
  setState({ ...IDLE_STATE, status: 'starting' })
  startMicSession(handleWindow, () => {
    window.setTimeout(restart, 0)
  }).then(
    (session) => {
      if (!refs.active.current) {
        session.stop()
        return
      }
      refs.session.current = session
      void setAudioSessionMode('capture')
      setState({ ...IDLE_STATE, status: 'listening' })
    },
    (error: unknown) => {
      const reason = error instanceof MicStreamError ? error.reason : 'unavailable'
      void setAudioSessionMode('playback')
      setState({ ...IDLE_STATE, status: 'error', error: reason })
    },
  )
}

export function stopMicSession(
  refs: SessionRefs,
  setState: Dispatch<SetStateAction<PitchState>>,
): void {
  refs.active.current = false
  refs.recent.current = []
  setState(IDLE_STATE)
  refs.session.current?.stop()
  refs.session.current = null
  // WebKit hands the session back to iOS defaults here, which would mute the
  // reference tones under the silent switch.
  void setAudioSessionMode('playback')
}
