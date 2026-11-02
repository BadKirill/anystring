import { useEffect, useRef, useState } from 'react'

import {
  initialStringLock,
  stepStringLock,
  type StringLockInput,
  type StringLockState,
} from '../core/tunings'
import { pulseHaptic } from '../platform/hapticPulse'

function stepMark(input: StringLockInput): string {
  return `${input.tuningKey}\u0000${input.screen}\u0000${String(input.stringIndex)}\u0000${String(input.inTune)}`
}

export function useStringLock(input: StringLockInput): readonly number[] {
  const stateRef = useRef<StringLockState>(initialStringLock(input.tuningKey))
  const seenRef = useRef<string | null>(null)
  const [checked, setChecked] = useState<readonly number[]>([])
  const { tuningKey, screen, stringIndex, inTune } = input

  useEffect(() => {
    const next: StringLockInput = { tuningKey, screen, stringIndex, inTune }
    const mark = stepMark(next)
    // StrictMode replays this effect. The same input must not pulse twice
    // or re-lock a sitting that a tuning-key change just cleared.
    if (seenRef.current === mark) {
      return
    }
    seenRef.current = mark
    const step = stepStringLock(stateRef.current, next)
    stateRef.current = step.state
    setChecked(step.state.checked)
    if (step.pulse) {
      pulseHaptic()
    }
  }, [tuningKey, screen, stringIndex, inTune])

  return checked
}
