import type { PitchStatus } from './pitchState'

export interface AutoStartInput {
  status: PitchStatus
  stoppedByUser: boolean
}

export function shouldAutoStart(input: AutoStartInput): boolean {
  return input.status === 'idle' && !input.stoppedByUser
}
