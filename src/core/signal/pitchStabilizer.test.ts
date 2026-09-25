import { describe, expect, it } from 'vitest'

import { initialPitchStabilizerState, stabilizePitchDisplay } from './pitchStabilizer'

const NOW = 1_000

function stabilize(
  state = initialPitchStabilizerState(),
  cents: number,
  clarity = 0.95,
  nowMs = NOW,
) {
  return stabilizePitchDisplay(state, {
    cents,
    direction: cents < -5 ? 'tighten' : cents > 5 ? 'loosen' : 'in-tune',
    clarity,
    nowMs,
    hasSignal: true,
  })
}

describe('stabilizePitchDisplay', () => {
  it('EC-attack-sharp damps sharp attack transients', () => {
    const first = stabilize(undefined, 18, 0.95, NOW)
    expect(first.cents).toBeLessThan(18)
    expect(first.cents).toBeGreaterThan(6)
  })

  it('EC-lock-2 latches to center after consecutive in-tune readings', () => {
    const first = stabilize(undefined, 2, 0.95, NOW)
    const second = stabilize(first.state, 3, 0.95, NOW + 40)
    expect(second.cents).toBe(0)
    expect(second.direction).toBe('in-tune')
    expect(second.state.latched).toBe(true)
  })

  it('holds center through small flat drift while the note fades', () => {
    let state = initialPitchStabilizerState()
    state = stabilize(state, 1, 0.95, NOW).state
    state = stabilize(state, 2, 0.95, NOW + 40).state
    expect(state.latched).toBe(true)

    const decay = stabilizePitchDisplay(state, {
      cents: -10,
      direction: 'tighten',
      clarity: 0.95,
      nowMs: NOW + 80,
      hasSignal: true,
    })
    expect(decay.cents).toBe(0)
    expect(decay.direction).toBe('in-tune')
  })

  it('releases the latch after a large detune', () => {
    let state = initialPitchStabilizerState()
    state = stabilize(state, 0, 0.95, NOW).state
    state = stabilize(state, 1, 0.95, NOW + 40).state
    const unlocked = stabilize(state, 20, 0.95, NOW + 500)
    expect(unlocked.state.latched).toBe(false)
    expect(unlocked.cents).toBeGreaterThan(10)
  })

  it('holds center for a small sharp drift while latched', () => {
    let state = initialPitchStabilizerState()
    state = stabilize(state, 0, 0.95, NOW).state
    state = stabilize(state, 1, 0.95, NOW + 40).state
    expect(state.latched).toBe(true)
    const held = stabilize(state, 10, 0.95, NOW + 80)
    expect(held.cents).toBe(0)
    expect(held.direction).toBe('in-tune')
    expect(held.state.latched).toBe(true)
  })

  it('does not latch after a single in-tune reading', () => {
    const first = stabilize(undefined, 2, 0.95, NOW)
    expect(first.state.latched).toBe(false)
    expect(first.cents).toBe(2)
  })

  it('resets when the signal drops after the decay window', () => {
    let state = initialPitchStabilizerState()
    state = stabilize(state, 0, 0.95, NOW).state
    state = stabilize(state, 1, 0.95, NOW + 40).state
    const gone = stabilizePitchDisplay(state, {
      cents: 12,
      direction: 'loosen',
      clarity: 0.2,
      nowMs: NOW + 600,
      hasSignal: false,
    })
    expect(gone.state.latched).toBe(false)
    expect(gone.cents).toBe(12)
    expect(gone.direction).toBe('loosen')
  })

  it('EC-attack-flat shows a flat attack at full cents', () => {
    const first = stabilize(undefined, -18, 0.95, NOW)
    expect(first.cents).toBe(-18)
  })

  it('EC-unlock-14 holds a 14-cent drift and releases at 15', () => {
    let state = initialPitchStabilizerState()
    state = stabilize(state, 0, 0.95, NOW).state
    state = stabilize(state, 1, 0.95, NOW + 40).state
    const held = stabilize(state, 14, 0.95, NOW + 500)
    expect(held.cents).toBe(0)
    expect(held.state.latched).toBe(true)
    const released = stabilize(state, 15, 0.95, NOW + 500)
    expect(released.state.latched).toBe(false)
    expect(released.cents).toBe(15)
  })

  it('passes through a weak first reading without latching', () => {
    const weak = stabilizePitchDisplay(initialPitchStabilizerState(), {
      cents: 8,
      direction: 'loosen',
      clarity: 0.2,
      nowMs: NOW,
      hasSignal: true,
    })
    expect(weak.state.latched).toBe(false)
    expect(weak.cents).toBe(8)
  })
})
