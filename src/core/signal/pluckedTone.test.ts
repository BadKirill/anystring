import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { pitchToFrequency } from '../music'
import { PLUCK_VOICES, type PluckVoice } from './pluckVoice'
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

function correlation(samples: Float32Array, start: number, lag: number): number {
  let sum = 0
  const length = 16000
  for (let i = 0; i < length; i += 2) {
    sum += (samples[start + i] ?? 0) * (samples[start + i + lag] ?? 0)
  }
  return sum
}

function pitchErrorCents(samples: Float32Array, frequency: number): number {
  const start = Math.floor(SAMPLE_RATE * 0.18)
  const expect = SAMPLE_RATE / frequency
  const min = Math.max(2, Math.floor(expect - 24))
  const max = Math.ceil(expect + 24)
  let bestLag = min
  let best = -Infinity
  for (let lag = min; lag <= max; lag += 1) {
    const score = correlation(samples, start, lag)
    if (score > best) {
      best = score
      bestLag = lag
    }
  }
  const below = correlation(samples, start, bestLag - 1)
  const above = correlation(samples, start, bestLag + 1)
  const denom = below - 2 * best + above
  const refined = denom === 0 ? bestLag : bestLag + (0.5 * (below - above)) / denom
  return 1200 * Math.log2(SAMPLE_RATE / refined / frequency)
}

function binPower(
  samples: Float32Array,
  start: number,
  length: number,
  bin: number,
): number {
  let real = 0
  let imag = 0
  for (let n = 0; n < length; n += 1) {
    const angle = (2 * Math.PI * bin * n) / length
    const sample = samples[start + n] ?? 0
    real += sample * Math.cos(angle)
    imag -= sample * Math.sin(angle)
  }
  return real * real + imag * imag
}

function highBandShare(samples: Float32Array, start = 256): number {
  const length = 2048
  let low = 0
  let high = 0
  for (let bin = 1; bin < length / 2; bin += 2) {
    const hz = (bin * SAMPLE_RATE) / length
    if (hz < 70 || hz > 7000) {
      continue
    }
    const power = binPower(samples, start, length, bin)
    if (hz >= 1600) {
      high += power
    } else {
      low += power
    }
  }
  return high / (low + high)
}

function heldLevel(samples: Float32Array): number {
  const mid = Math.floor(SAMPLE_RATE * 0.7)
  return rms(samples, mid, mid + 2000) / rms(samples, 500, 1800)
}

function attackShare(samples: Float32Array): number {
  const body = Math.floor(SAMPLE_RATE * 0.12)
  return rms(samples, 0, 180) / rms(samples, body, body + 900)
}

function sustainRatio(samples: Float32Array): number {
  const tailFrom = Math.max(0, samples.length - 2400)
  return rms(samples, tailFrom, samples.length) / rms(samples, 200, 1200)
}

function rendered(frequency: number, voice: PluckVoice, durationS = 1.2): Float32Array {
  return normalizePluck(synthesizePluck(frequency, SAMPLE_RATE, durationS, voice))
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

  it('synthesizes a mid-range guitar note without collapsing to silence', () => {
    const samples = normalizePluck(synthesizePluck(110, SAMPLE_RATE, 1))
    expect(rms(samples, 0, 400)).toBeGreaterThan(0.05)
  })

  it('leaves an already-silent buffer unchanged', () => {
    const silent = new Float32Array(32)
    expect(normalizePluck(silent)).toBe(silent)
  })

  it('EC-voice-pitch keeps the fundamental within 5 cents', () => {
    const notes = [
      { hz: 82.41, voice: PLUCK_VOICES.guitar },
      { hz: 41.2, voice: PLUCK_VOICES.bass },
      { hz: 440, voice: PLUCK_VOICES.ukulele },
    ]
    for (const note of notes) {
      const samples = rendered(note.hz, note.voice)
      expect(Math.abs(pitchErrorCents(samples, note.hz))).toBeLessThanOrEqual(5)
    }
  })

  it('EC-voice-timbre makes ukulele brighter than guitar, and guitar brighter than bass', () => {
    const ukulele = highBandShare(rendered(196, PLUCK_VOICES.ukulele, 0.6))
    const guitar = highBandShare(rendered(196, PLUCK_VOICES.guitar, 0.6))
    const bass = highBandShare(rendered(196, PLUCK_VOICES.bass, 0.6))
    expect(ukulele).toBeGreaterThan(guitar)
    expect(guitar).toBeGreaterThan(bass)
  })

  it('EC-voice-decay lets bass ring longer than guitar, and guitar longer than ukulele', () => {
    const ukulele = sustainRatio(rendered(196, PLUCK_VOICES.ukulele, 1.2))
    const guitar = sustainRatio(rendered(196, PLUCK_VOICES.guitar, 1.2))
    const bass = sustainRatio(rendered(196, PLUCK_VOICES.bass, 1.2))
    expect(ukulele).toBeLessThan(guitar)
    expect(guitar).toBeLessThan(bass)
  })

  it('EC-voice-low keeps five-string bass B0 on pitch', () => {
    const frequency = pitchToFrequency({ note: 'B', octave: 0 })
    const samples = rendered(frequency, PLUCK_VOICES.bass, 1.4)
    expect(rms(samples, 0, 800)).toBeGreaterThan(0.04)
    expect(Math.abs(pitchErrorCents(samples, frequency))).toBeLessThanOrEqual(5)
  })

  it('EC-voice-high keeps a high note on pitch', () => {
    const frequency = pitchToFrequency({ note: 'E', octave: 6 })
    const samples = rendered(frequency, PLUCK_VOICES.ukulele, 0.8)
    expect(rms(samples, 0, 400)).toBeGreaterThan(0.04)
    expect(Math.abs(pitchErrorCents(samples, frequency))).toBeLessThanOrEqual(5)
  })

  it('EC-voice-invalid renders silence for a non-positive frequency', () => {
    expect(rms(synthesizePluck(0, SAMPLE_RATE, 0.2), 0, 100)).toBe(0)
    expect(rms(synthesizePluck(Number.NaN, SAMPLE_RATE, 0.2), 0, 100)).toBe(0)
  })

  it('EC-bow-pitch keeps violin, viola, cello, and double bass within 5 cents', () => {
    const notes = [
      { pitch: { note: 'A' as const, octave: 4 }, voice: PLUCK_VOICES.violin },
      { pitch: { note: 'D' as const, octave: 3 }, voice: PLUCK_VOICES.viola },
      { pitch: { note: 'G' as const, octave: 2 }, voice: PLUCK_VOICES.cello },
      { pitch: { note: 'E' as const, octave: 1 }, voice: PLUCK_VOICES['double-bass'] },
    ]
    for (const note of notes) {
      const frequency = pitchToFrequency(note.pitch)
      const samples = rendered(frequency, note.voice, 1.3)
      expect(Math.abs(pitchErrorCents(samples, frequency))).toBeLessThanOrEqual(5)
    }
  })

  it('EC-bow-timbre is brighter from violin down to double bass', () => {
    const start = Math.floor(SAMPLE_RATE * 0.16)
    const violin = highBandShare(rendered(220, PLUCK_VOICES.violin, 0.7), start)
    const viola = highBandShare(rendered(220, PLUCK_VOICES.viola, 0.7), start)
    const cello = highBandShare(rendered(220, PLUCK_VOICES.cello, 0.7), start)
    const bass = highBandShare(rendered(220, PLUCK_VOICES['double-bass'], 0.7), start)
    expect(violin).toBeGreaterThan(viola)
    expect(viola).toBeGreaterThan(cello)
    expect(cello).toBeGreaterThan(bass)
  })

  it('EC-bow-sustain holds a violin after a ukulele has faded', () => {
    const violin = heldLevel(rendered(440, PLUCK_VOICES.violin, 1.2))
    const ukulele = heldLevel(rendered(440, PLUCK_VOICES.ukulele, 1.2))
    expect(violin).toBeGreaterThan(ukulele)
    expect(violin).toBeGreaterThan(0.55)
  })

  it('EC-bow-attack swells a bow in more slowly than a guitar pluck', () => {
    const violin = attackShare(rendered(440, PLUCK_VOICES.violin, 0.6))
    const guitar = attackShare(rendered(196, PLUCK_VOICES.guitar, 0.6))
    expect(violin).toBeLessThan(guitar)
  })
})
