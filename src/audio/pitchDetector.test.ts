import { describe, expect, it } from 'vitest'

import {
  detectPitch,
  minClarityFor,
  minRmsFor,
  removeDc,
  signalRms,
} from './pitchDetector'

const SAMPLE_RATE = 48000
const WINDOW_SIZE = 8192

/** Synthesizes a decaying plucked-string-like tone with a few harmonics. */
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

function quietNoise(level: number): Float32Array {
  const samples = new Float32Array(WINDOW_SIZE)
  for (let i = 0; i < WINDOW_SIZE; i += 1) {
    samples[i] = (Math.random() * 2 - 1) * level
  }
  return samples
}

function quietRumble(frequency: number, amplitude: number): Float32Array {
  const samples = new Float32Array(WINDOW_SIZE)
  for (let i = 0; i < WINDOW_SIZE; i += 1) {
    samples[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / SAMPLE_RATE)
  }
  return samples
}

describe('detectPitch', () => {
  it('detects low bass F1 (~43.65 Hz, Demiurge low string)', () => {
    const reading = detectPitch(pluckedTone(43.65), SAMPLE_RATE)
    expect(reading).not.toBeNull()
    expect(reading?.frequency).toBeCloseTo(43.65, 0)
  })

  it('detects a quieter F1 pluck that is still above the bass RMS floor', () => {
    const reading = detectPitch(pluckedTone(43.65, 0.03), SAMPLE_RATE)
    expect(reading).not.toBeNull()
    expect(reading?.frequency).toBeCloseTo(43.65, 0)
  })

  it('detects guitar low E2 (~82.41 Hz)', () => {
    const reading = detectPitch(pluckedTone(82.41), SAMPLE_RATE)
    expect(reading?.frequency).toBeCloseTo(82.41, 0)
  })

  it('detects A4 (440 Hz)', () => {
    const reading = detectPitch(pluckedTone(440), SAMPLE_RATE)
    expect(reading?.frequency).toBeCloseTo(440, 0)
  })

  it('rejects silence', () => {
    expect(detectPitch(new Float32Array(WINDOW_SIZE), SAMPLE_RATE)).toBeNull()
  })

  it('rejects white noise', () => {
    expect(detectPitch(quietNoise(1), SAMPLE_RATE)).toBeNull()
  })

  it('rejects quiet WKWebView-like bass hum that pitchy finds with high clarity', () => {
    const hum = quietRumble(40, 0.005)
    expect(signalRms(hum)).toBeLessThan(minRmsFor(40))
    expect(detectPitch(hum, SAMPLE_RATE)).toBeNull()
  })

  it('rejects DC-biased silence', () => {
    const biased = new Float32Array(WINDOW_SIZE)
    biased.fill(0.01)
    expect(detectPitch(biased, SAMPLE_RATE)).toBeNull()
  })
})

describe('pitch gates', () => {
  it('asks for a louder floor under 55 Hz than at guitar range', () => {
    expect(minRmsFor(43)).toBeGreaterThan(minRmsFor(82))
    expect(minRmsFor(82)).toBeGreaterThan(minRmsFor(440))
  })

  it('keeps bass clarity strict enough to reject weak correlations', () => {
    expect(minClarityFor(43)).toBeGreaterThanOrEqual(0.88)
  })

  it('removeDc centers a constant offset at zero', () => {
    const biased = new Float32Array([0.2, 0.2, 0.2, 0.2])
    const centered = removeDc(biased)
    expect(signalRms(centered)).toBeCloseTo(0, 5)
  })
})
