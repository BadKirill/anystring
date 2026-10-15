import { describe, expect, it } from 'vitest'

import { pitchToFrequency, pitchToMidi, type Pitch } from '../music'
import { analyze } from './analyzer'
import {
  initialStringLock,
  stepStringLock,
  tuningLockKey,
  type StringLockInput,
  type StringLockState,
} from './stringLock'
import type { Tuning } from './types'

const KEY = tuningLockKey('guitar-standard', [40, 45, 50, 55, 59, 64])

function input(overrides: Partial<StringLockInput> = {}): StringLockInput {
  return {
    tuningKey: KEY,
    screen: 'strings',
    stringIndex: 0,
    inTune: false,
    ...overrides,
  }
}

function locked(index: number): StringLockState {
  return stepStringLock(
    initialStringLock(KEY),
    input({ stringIndex: index, inTune: true }),
  ).state
}

describe('stepStringLock', () => {
  it('EC-lock-first checks a string and pulses the first time it is in tune', () => {
    const step = stepStringLock(initialStringLock(KEY), input({ inTune: true }))
    expect(step.state.checked).toEqual([0])
    expect(step.state.holding).toBe(0)
    expect(step.pulse).toBe(true)
  })

  it('EC-lock-hold stays quiet while that string is still in tune', () => {
    const step = stepStringLock(locked(0), input({ inTune: true }))
    expect(step.state.checked).toEqual([0])
    expect(step.state.holding).toBe(0)
    expect(step.pulse).toBe(false)
  })

  it('EC-lock-rearm pulses again after the direction leaves in-tune and the check remains', () => {
    const released = stepStringLock(locked(0), input({ inTune: false }))
    expect(released.state.checked).toEqual([0])
    expect(released.state.holding).toBeNull()
    expect(released.pulse).toBe(false)

    const again = stepStringLock(released.state, input({ inTune: true }))
    expect(again.state.checked).toEqual([0])
    expect(again.state.holding).toBe(0)
    expect(again.pulse).toBe(true)
  })

  it('EC-lock-switch lets a different string check and pulse on its own', () => {
    const step = stepStringLock(locked(0), input({ stringIndex: 1, inTune: true }))
    expect(step.state.checked).toEqual([0, 1])
    expect(step.state.holding).toBe(1)
    expect(step.pulse).toBe(true)
  })

  it('EC-lock-chromatic changes nothing and does not pulse', () => {
    const held = locked(0)
    const step = stepStringLock(
      held,
      input({ screen: 'chromatic', stringIndex: 0, inTune: true }),
    )
    expect(step.state.checked).toBe(held.checked)
    expect(step.state.holding).toBeNull()
    expect(step.pulse).toBe(false)
  })

  it('EC-lock-silent clears the hold for a null string index and does not pulse', () => {
    const held = locked(0)
    const step = stepStringLock(held, input({ stringIndex: null, inTune: true }))
    expect(step.state.checked).toEqual([0])
    expect(step.state.holding).toBeNull()
    expect(step.pulse).toBe(false)
  })

  it('EC-lock-tuning clears checks when the tuning key changes', () => {
    const nextKey = tuningLockKey('custom-draft', [41, 45, 50, 55, 59, 64])
    const step = stepStringLock(
      locked(0),
      input({ tuningKey: nextKey, stringIndex: 0, inTune: true }),
    )
    expect(step.state.checked).toEqual([])
    expect(step.state.holding).toBeNull()
    expect(step.state.tuningKey).toBe(nextKey)
    expect(step.pulse).toBe(false)
  })

  it('EC-lock-duplicate checks only the analyzed index', () => {
    const pitch: Pitch = { note: 'E', octave: 2 }
    const twins: Tuning = {
      id: 'twins',
      name: 'Twins',
      instrument: 'guitar',
      strings: [{ pitch }, { pitch }],
    }
    const analysis = analyze(pitchToFrequency(pitch), twins)
    const key = tuningLockKey('twins', [pitchToMidi(pitch), pitchToMidi(pitch)])
    const step = stepStringLock(initialStringLock(key), {
      tuningKey: key,
      screen: 'strings',
      stringIndex: analysis === null ? null : analysis.stringIndex,
      inTune: analysis?.direction === 'in-tune',
    })
    expect(analysis?.stringIndex).toBe(0)
    expect(step.state.checked).toEqual([0])
    expect(step.pulse).toBe(true)
  })
})
