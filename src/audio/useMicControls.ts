import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'

import { onAppResume } from './appResume'
import { STALE_BACKGROUND_MS } from './audioContextResume'
import {
  beginMicSession,
  resumeMicSession,
  stopMicSession,
  type SessionRefs,
} from './micSessionControl'
import { createMicWindowHandler } from './micWindowHandler'
import type { MicSession } from './micStream'
import { shouldAutoStart } from './autoStart'
import type { PitchState, PitchStatus } from './pitchState'

function buildRefs(
  active: RefObject<boolean>,
  session: RefObject<MicSession | null>,
  recent: RefObject<number[]>,
  generation: RefObject<number>,
): SessionRefs {
  return { active, session, recent, generation }
}

function useFoldResume(activeRef: RefObject<boolean>, getRefs: () => SessionRefs): void {
  useEffect(() => {
    const onResize = (): void => {
      if (!activeRef.current) {
        return
      }
      void resumeMicSession(getRefs())
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [activeRef, getRefs])
}

function useMicResume(
  activeRef: RefObject<boolean>,
  getRefs: () => SessionRefs,
  restartRef: RefObject<() => void>,
): void {
  useEffect(() => {
    return onAppResume(({ hiddenMs }) => {
      if (!activeRef.current) {
        return
      }
      if (hiddenMs >= STALE_BACKGROUND_MS) {
        restartRef.current()
        return
      }
      void resumeMicSession(getRefs()).then((ok) => {
        if (!ok && activeRef.current) {
          restartRef.current()
        }
      })
    })
  }, [activeRef, getRefs, restartRef])
}

function useAutoStart(
  status: PitchStatus,
  stoppedByUser: RefObject<boolean>,
  start: () => void,
): void {
  useEffect(() => {
    if (shouldAutoStart({ status, stoppedByUser: stoppedByUser.current })) {
      start()
    }
  }, [status, start, stoppedByUser])
}

export function useMicControls(
  setState: Dispatch<SetStateAction<PitchState>>,
  status: PitchStatus,
): {
  start: () => void
  stop: () => void
} {
  const sessionRef = useRef<MicSession | null>(null)
  const recentRef = useRef<number[]>([])
  const activeRef = useRef(false)
  const generationRef = useRef(0)
  const stoppedByUserRef = useRef(false)
  const restartRef = useRef<() => void>(() => undefined)
  const handleWindow = useMemo(
    () => createMicWindowHandler(() => activeRef.current, recentRef.current, setState),
    [setState],
  )

  const getRefs = useCallback(
    () => buildRefs(activeRef, sessionRef, recentRef, generationRef),
    [],
  )

  const restart = useCallback(() => {
    beginMicSession(getRefs(), setState, handleWindow, () => {
      restartRef.current()
    })
  }, [getRefs, handleWindow, setState])

  useEffect(() => {
    restartRef.current = restart
  }, [restart])

  const stop = useCallback(() => {
    stoppedByUserRef.current = true
    stopMicSession(getRefs(), setState)
  }, [getRefs, setState])

  const start = useCallback(() => {
    if (status === 'starting' || status === 'listening') {
      return
    }
    activeRef.current = true
    restart()
  }, [restart, status])

  useAutoStart(status, stoppedByUserRef, start)

  useMicResume(activeRef, getRefs, restartRef)
  useFoldResume(activeRef, getRefs)

  // Unmount is not a user Stop. StrictMode replays effects, and marking
  // stoppedByUser here would leave the replayed open silent.
  useEffect(() => {
    return () => {
      stopMicSession(getRefs(), setState)
    }
  }, [getRefs, setState])

  return { start, stop }
}
