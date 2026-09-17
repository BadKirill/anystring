import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMicWindowHandler } from './micWindowHandler'
import * as pitchGate from './pitchGate'
import type { PitchState } from './pitchState'

const SAMPLE_RATE = 48000
const WINDOW_SIZE = 8192

function pluckedTone(frequency: number, gain = 1): Float32Array {
  const samples = new Float32Array(WINDOW_SIZE)
  for (let i = 0; i < WINDOW_SIZE; i += 1) {
    const t = i / SAMPLE_RATE
    const envelope = Math.exp(-t * 1.5)
    samples[i] =
      gain *
      envelope *
      (Math.sin(2 * Math.PI * frequency * t) +
        0.5 * Math.sin(2 * Math.PI * 2 * frequency * t) +
        0.25 * Math.sin(2 * Math.PI * 3 * frequency * t))
  }
  return samples
}

function emptyState(): PitchState {
  return { status: 'listening', error: null, frequency: null, clarity: null }
}

describe('createMicWindowHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ignores windows while inactive or suppressed', () => {
    const setState = vi.fn()
    const recent: number[] = []
    const handler = createMicWindowHandler(() => false, recent, setState)
    handler(pluckedTone(440), SAMPLE_RATE)
    expect(setState).not.toHaveBeenCalled()
    vi.spyOn(pitchGate, 'isPitchDetectionSuppressed').mockReturnValue(true)
    const active = createMicWindowHandler(() => true, recent, setState)
    active(pluckedTone(440), SAMPLE_RATE)
    expect(setState).not.toHaveBeenCalled()
  })

  it('requires three stable readings before publishing a frequency', () => {
    const setState = vi.fn((update: PitchState | ((prev: PitchState) => PitchState)) => {
      if (typeof update === 'function') {
        update(emptyState())
      }
    })
    const recent: number[] = []
    const handler = createMicWindowHandler(() => true, recent, setState)
    const a4 = pluckedTone(440)
    handler(a4, SAMPLE_RATE)
    handler(a4, SAMPLE_RATE)
    expect(recent).toHaveLength(2)
    const published = setState.mock.calls[setState.mock.calls.length - 1]?.[0]
    const afterTwo = typeof published === 'function' ? published(emptyState()) : published
    expect(afterTwo?.frequency).toBeNull()
    handler(a4, SAMPLE_RATE)
    const last = setState.mock.calls[setState.mock.calls.length - 1]?.[0]
    const afterThree = typeof last === 'function' ? last(emptyState()) : last
    expect(afterThree?.frequency).toBeCloseTo(440, 0)
    expect(afterThree?.clarity).toBeGreaterThan(0.8)
  })

  it('clears the window on silence or a huge jump', () => {
    const states: PitchState[] = []
    const setState = vi.fn((update: PitchState | ((prev: PitchState) => PitchState)) => {
      const next = typeof update === 'function' ? update(emptyState()) : update
      states.push(next)
    })
    const recent: number[] = []
    const handler = createMicWindowHandler(() => true, recent, setState)
    const a4 = pluckedTone(440)
    handler(a4, SAMPLE_RATE)
    handler(a4, SAMPLE_RATE)
    handler(a4, SAMPLE_RATE)
    handler(a4, SAMPLE_RATE)
    handler(a4, SAMPLE_RATE)
    handler(a4, SAMPLE_RATE)
    expect(recent).toHaveLength(5)
    handler(new Float32Array(WINDOW_SIZE), SAMPLE_RATE)
    expect(recent).toHaveLength(0)
    expect(states[states.length - 1]?.frequency).toBeNull()
    handler(a4, SAMPLE_RATE)
    handler(a4, SAMPLE_RATE)
    handler(pluckedTone(82.41), SAMPLE_RATE)
    expect(recent).toHaveLength(0)
  })
})
