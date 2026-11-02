export interface StringLockState {
  checked: readonly number[]
  holding: number | null
  /** Identity of the sitting. A different key clears checks on the next step. */
  tuningKey: string
}

export interface StringLockInput {
  tuningKey: string
  screen: 'strings' | 'chromatic'
  stringIndex: number | null
  inTune: boolean
}

export interface StringLockStep {
  state: StringLockState
  pulse: boolean
}

export function tuningLockKey(id: string, midis: readonly number[]): string {
  return `${id}:${midis.join(',')}`
}

export function initialStringLock(tuningKey: string): StringLockState {
  return { checked: [], holding: null, tuningKey }
}

function resetForKey(tuningKey: string): StringLockStep {
  return {
    state: { checked: [], holding: null, tuningKey },
    pulse: false,
  }
}

function releaseHold(state: StringLockState): StringLockStep {
  if (state.holding === null) {
    return { state, pulse: false }
  }
  return { state: { ...state, holding: null }, pulse: false }
}

function lockString(state: StringLockState, stringIndex: number): StringLockStep {
  const checked = state.checked.includes(stringIndex)
    ? state.checked
    : [...state.checked, stringIndex]
  return {
    state: { checked, holding: stringIndex, tuningKey: state.tuningKey },
    pulse: true,
  }
}

export function stepStringLock(
  state: StringLockState,
  input: StringLockInput,
): StringLockStep {
  if (state.tuningKey !== input.tuningKey) {
    return resetForKey(input.tuningKey)
  }
  if (input.screen === 'chromatic' || input.stringIndex === null) {
    return releaseHold(state)
  }
  if (input.inTune && state.holding === input.stringIndex) {
    return { state, pulse: false }
  }
  if (input.inTune) {
    return lockString(state, input.stringIndex)
  }
  return releaseHold(state)
}
