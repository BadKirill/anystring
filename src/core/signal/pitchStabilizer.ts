import { IN_TUNE_CENTS, type TuneDirection } from '../tunings/analyzer'

export interface PitchStabilizerState {
  consecutiveInTune: number
  latched: boolean
  lastSignalMs: number
  attackEndsMs: number
  hadSignal: boolean
}

export function initialPitchStabilizerState(): PitchStabilizerState {
  return {
    consecutiveInTune: 0,
    latched: false,
    lastSignalMs: 0,
    attackEndsMs: 0,
    hadSignal: false,
  }
}

export interface StabilizePitchInput {
  cents: number
  direction: TuneDirection
  clarity: number
  nowMs: number
  hasSignal: boolean
}

export interface StabilizePitchOutput {
  cents: number
  direction: TuneDirection
  state: PitchStabilizerState
}

const LOCK_READINGS = 2
const ATTACK_MS = 200
const UNLOCK_CENTS = 14
const DECAY_HOLD_MS = 450
const SHARP_ATTACK_THRESHOLD = 6
const SHARP_DAMPING = 0.35
const MIN_CLARITY = 0.5

function directionFor(cents: number): TuneDirection {
  if (Math.abs(cents) <= IN_TUNE_CENTS) {
    return 'in-tune'
  }
  return cents < 0 ? 'tighten' : 'loosen'
}

function dampAttackSharpness(cents: number, nowMs: number, attackEndsMs: number): number {
  if (nowMs >= attackEndsMs || cents <= SHARP_ATTACK_THRESHOLD) {
    return cents
  }
  const excess = cents - SHARP_ATTACK_THRESHOLD
  return SHARP_ATTACK_THRESHOLD + excess * SHARP_DAMPING
}

function withSignal(state: PitchStabilizerState, nowMs: number): PitchStabilizerState {
  const next = { ...state, lastSignalMs: nowMs }
  if (state.hadSignal) {
    return next
  }
  return { ...next, attackEndsMs: nowMs + ATTACK_MS, hadSignal: true }
}

function latchedReading(state: PitchStabilizerState): StabilizePitchOutput {
  return { cents: 0, direction: 'in-tune', state }
}

function applyInTuneProgress(
  state: PitchStabilizerState,
  displayCents: number,
): StabilizePitchOutput {
  const next = { ...state, consecutiveInTune: state.consecutiveInTune + 1 }
  if (next.consecutiveInTune >= LOCK_READINGS) {
    return latchedReading({ ...next, latched: true })
  }
  return {
    cents: displayCents,
    direction: directionFor(displayCents),
    state: next,
  }
}

function applyOutOfTuneReading(
  state: PitchStabilizerState,
  displayCents: number,
): StabilizePitchOutput {
  const abs = Math.abs(displayCents)
  let next = { ...state, consecutiveInTune: 0 }
  if (state.latched && abs > UNLOCK_CENTS) {
    next = { ...next, latched: false }
  }
  if (next.latched) {
    return latchedReading(next)
  }
  return {
    cents: displayCents,
    direction: directionFor(displayCents),
    state: next,
  }
}

export function stabilizePitchDisplay(
  state: PitchStabilizerState,
  input: StabilizePitchInput,
): StabilizePitchOutput {
  const { cents: rawCents, direction: rawDirection, clarity, nowMs, hasSignal } = input

  if (!hasSignal || clarity < MIN_CLARITY) {
    if (state.latched && nowMs - state.lastSignalMs < DECAY_HOLD_MS) {
      return latchedReading(state)
    }
    return {
      cents: rawCents,
      direction: rawDirection,
      state: initialPitchStabilizerState(),
    }
  }

  const next = withSignal(state, nowMs)
  const displayCents = dampAttackSharpness(rawCents, nowMs, next.attackEndsMs)

  if (state.latched && displayCents < 0 && Math.abs(displayCents) <= UNLOCK_CENTS) {
    return latchedReading(next)
  }

  if (Math.abs(displayCents) <= IN_TUNE_CENTS) {
    return applyInTuneProgress(next, displayCents)
  }

  return applyOutOfTuneReading(next, displayCents)
}
