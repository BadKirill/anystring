import { describe, expect, it } from 'vitest'

import {
  formatPitch,
  isNoteName,
  MAX_OCTAVE,
  midiToPitch,
  MIN_OCTAVE,
  pitchToMidi,
  pitchesEqual,
  type Pitch,
} from './notes'

describe('pitchToMidi', () => {
  it('maps C4 to 60 and A4 to 69', () => {
    expect(pitchToMidi({ note: 'C', octave: 4 })).toBe(60)
    expect(pitchToMidi({ note: 'A', octave: 4 })).toBe(69)
  })

  it('maps the Demiurge bass strings', () => {
    expect(pitchToMidi({ note: 'F', octave: 1 })).toBe(29)
    expect(pitchToMidi({ note: 'A#', octave: 1 })).toBe(34)
    expect(pitchToMidi({ note: 'D#', octave: 2 })).toBe(39)
    expect(pitchToMidi({ note: 'G#', octave: 2 })).toBe(44)
  })
})

describe('midiToPitch', () => {
  it('is the inverse of pitchToMidi across the playable range', () => {
    for (let midi = 12; midi <= 108; midi += 1) {
      expect(pitchToMidi(midiToPitch(midi))).toBe(midi)
    }
  })

  it('rounds fractional midi numbers to the nearest note', () => {
    expect(midiToPitch(68.6)).toEqual<Pitch>({ note: 'A', octave: 4 })
    expect(midiToPitch(69.4)).toEqual<Pitch>({ note: 'A', octave: 4 })
  })

  it('rejects a non-numeric midi value', () => {
    expect(() => midiToPitch(Number.NaN)).toThrow(/MIDI number out of range/)
  })
})

describe('formatPitch', () => {
  it('formats note and octave', () => {
    expect(formatPitch({ note: 'G#', octave: 1 })).toBe('G#1')
    expect(formatPitch({ note: 'E', octave: 2 })).toBe('E2')
  })
})

describe('isNoteName', () => {
  it('EC-bad-note accepts the 12 sharp names and rejects flats and unknowns', () => {
    expect(isNoteName('E')).toBe(true)
    expect(isNoteName('G#')).toBe(true)
    expect(isNoteName('Bb')).toBe(false)
    expect(isNoteName('H')).toBe(false)
    expect(MIN_OCTAVE).toBe(0)
    expect(MAX_OCTAVE).toBe(6)
  })
})

describe('pitchesEqual', () => {
  it('matches identical pitches', () => {
    expect(pitchesEqual({ note: 'E', octave: 2 }, { note: 'E', octave: 2 })).toBe(true)
    expect(pitchesEqual({ note: 'E', octave: 2 }, { note: 'F', octave: 2 })).toBe(false)
  })
})
