import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { normalizePluck, synthesizePluck } from './pluckedTone'

const SAMPLE_RATE = 48000

function rms(samples: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let i = from; i < to; i += 1) {
    const sample = samples[i] ?? 0
    sum += sample * sample
  }
  return Math.sqrt(sum / (to - from))
}

function seedRandom(seed: number): void {
  let state = seed
  vi.spyOn(Math, 'random').mockImplementation(() => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  })
}

describe('pluckedTone', () => {
  beforeEach(() => {
    seedRandom(0xdecaf)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('synthesizes a decaying pluck for guitar E2', () => {
    const samples = normalizePluck(synthesizePluck(82.41, SAMPLE_RATE, 1.5))
    expect(samples.length).toBe(Math.floor(SAMPLE_RATE * 1.5))
    expect(rms(samples, 0, 400)).toBeGreaterThan(0.05)
    expect(rms(samples, samples.length - 400, samples.length)).toBeLessThan(
      rms(samples, 0, 400) * 0.5,
    )
  })

  it('synthesizes bass low F1 without silence', () => {
    const samples = normalizePluck(synthesizePluck(43.65, SAMPLE_RATE, 2))
    expect(rms(samples, 0, 800)).toBeGreaterThan(0.03)
  })
})
