import { describe, expect, it } from 'vitest'

import { frequencyToMidiFloat, midiToFrequency, pitchToFrequency } from './frequency'

describe('midiToFrequency', () => {
  it('EC-a440 maps A4 (69) to 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 6)
  })

  it('maps standard guitar low E2 to ~82.41 Hz', () => {
    expect(midiToFrequency(40)).toBeCloseTo(82.407, 3)
  })
})

describe('pitchToFrequency', () => {
  it('maps the Demiurge bass strings to their frequencies', () => {
    expect(pitchToFrequency({ note: 'F', octave: 1 })).toBeCloseTo(43.654, 3)
    expect(pitchToFrequency({ note: 'G#', octave: 1 })).toBeCloseTo(51.913, 3)
    expect(pitchToFrequency({ note: 'A#', octave: 1 })).toBeCloseTo(58.27, 2)
    expect(pitchToFrequency({ note: 'D#', octave: 2 })).toBeCloseTo(77.782, 3)
  })
})

describe('frequencyToMidiFloat', () => {
  it('is the inverse of midiToFrequency', () => {
    for (let midi = 20; midi <= 100; midi += 1) {
      expect(frequencyToMidiFloat(midiToFrequency(midi))).toBeCloseTo(midi, 9)
    }
  })

  it('returns fractional values between notes', () => {
    expect(frequencyToMidiFloat(445)).toBeGreaterThan(69)
    expect(frequencyToMidiFloat(445)).toBeLessThan(69.5)
  })
})
