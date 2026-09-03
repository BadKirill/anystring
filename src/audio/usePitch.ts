import { useState } from 'react'

import type { PitchState } from './pitchState'
import { useMicControls } from './useMicControls'

export type { PitchState, PitchStatus } from './pitchState'

export function usePitch(): PitchState & { start: () => void; stop: () => void } {
  const [state, setState] = useState<PitchState>({
    status: 'idle',
    error: null,
    frequency: null,
    clarity: null,
  })
  const controls = useMicControls(setState)
  return { ...state, ...controls }
}
