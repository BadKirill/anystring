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

export interface SessionRefs {
  active: { current: boolean }
  session: { current: MicSession | null }
  recent: { current: number[] }
  /** Bumps on every begin so stale getUserMedia promises cannot win. */
  generation: { current: number }
}

function isStale(refs: SessionRefs, generation: number): boolean {
  return !refs.active.current || refs.generation.current !== generation
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
  const generation = refs.generation.current + 1
  refs.generation.current = generation
  refs.recent.current = []
  refs.session.current?.stop()
  refs.session.current = null
  setState({ ...IDLE_STATE, status: 'starting' })
  // play-and-record before getUserMedia so WKWebView keeps input routed.
  setAudioSessionMode('capture')
  startMicSession(handleWindow, () => {
    if (document.visibilityState === 'hidden') {
      return
    }
    window.setTimeout(restart, 0)
  }).then(
    (session) => {
      if (isStale(refs, generation)) {
        session.stop()
        return
      }
      refs.session.current = session
      setAudioSessionMode('capture')
      setState({ ...IDLE_STATE, status: 'listening' })
    },
    (error: unknown) => {
      if (isStale(refs, generation)) {
        return
      }
      // Stop auto-resume loops: a failed start must not hammer getUserMedia.
      refs.active.current = false
      const reason = error instanceof MicStreamError ? error.reason : 'unavailable'
      setAudioSessionMode('playback')
      setState({ ...IDLE_STATE, status: 'error', error: reason })
    },
  )
}

/** Soft-resume an existing session after foregrounding; false if rebuild needed. */
export async function resumeMicSession(refs: SessionRefs): Promise<boolean> {
  const session = refs.session.current
  if (!refs.active.current || !session) {
    return false
  }
  const ok = await session.resume()
  if (ok) {
    setAudioSessionMode('capture')
  }
  return ok
}

export function stopMicSession(
  refs: SessionRefs,
  setState: Dispatch<SetStateAction<PitchState>>,
): void {
  refs.active.current = false
  refs.generation.current += 1
  refs.recent.current = []
  setState(IDLE_STATE)
  refs.session.current?.stop()
  refs.session.current = null
  // WebKit hands the session back to Ambient here under the silent switch.
  setAudioSessionMode('playback')
}
