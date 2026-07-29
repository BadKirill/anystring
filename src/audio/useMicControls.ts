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
import {
  beginMicSession,
  resumeMicSession,
  stopMicSession,
  type SessionRefs,
} from './micSessionControl'
import { createMicWindowHandler } from './micWindowHandler'
import type { MicSession } from './micStream'
import type { PitchState } from './pitchState'

function buildRefs(
  active: RefObject<boolean>,
  session: RefObject<MicSession | null>,
  recent: RefObject<number[]>,
  generation: RefObject<number>,
): SessionRefs {
  return { active, session, recent, generation }
}

function useMicResume(
  activeRef: RefObject<boolean>,
  getRefs: () => SessionRefs,
  restartRef: RefObject<() => void>,
): void {
  useEffect(() => {
    return onAppResume(() => {
      if (!activeRef.current) {
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

export function useMicControls(setState: Dispatch<SetStateAction<PitchState>>): {
  start: () => void
  stop: () => void
} {
  const sessionRef = useRef<MicSession | null>(null)
  const recentRef = useRef<number[]>([])
  const activeRef = useRef(false)
  const generationRef = useRef(0)
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
    stopMicSession(getRefs(), setState)
  }, [getRefs, setState])

  const start = useCallback(() => {
    activeRef.current = true
    // Always rebuild: a suspended/dead session can leave sessionRef set while silent.
    restart()
  }, [restart])

  useMicResume(activeRef, getRefs, restartRef)

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { start, stop }
}
