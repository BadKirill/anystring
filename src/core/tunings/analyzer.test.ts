import { describe, expect, it } from 'vitest'

import { pitchToFrequency, type NoteName } from '../music'
import { analyze, analyzeChromatic, analyzeString } from './analyzer'
import { PRESET_TUNINGS } from './presets'
import type { Tuning } from './types'

function tuningOf(specs: [NoteName, number][]): Tuning {
  return {
    id: 'test',
    name: 'Test',
    instrument: 'bass',
    strings: specs.map(([note, octave]) => ({ pitch: { note, octave } })),
  }
}

const DEMIURGE = tuningOf([
  ['F', 1],
  ['A#', 1],
  ['D#', 2],
  ['G#', 2],
])

describe('analyze', () => {
  it('reports in-tune when playing exactly the target frequency', () => {
    const f1 = pitchToFrequency({ note: 'F', octave: 1 })
    const result = analyze(f1, DEMIURGE)
    expect(result).toEqual({ stringIndex: 0, cents: 0, direction: 'in-tune' })
  })

  it('matches every Demiurge string to itself', () => {
    for (const [index, string] of DEMIURGE.strings.entries()) {
      const result = analyze(pitchToFrequency(string.pitch), DEMIURGE)
      expect(result?.stringIndex).toBe(index)
    }
  })

  it('says tighten when flat and loosen when sharp', () => {
    const target = pitchToFrequency({ note: 'A#', octave: 1 })
    expect(analyze(target * 0.98, DEMIURGE)?.direction).toBe('tighten')
    expect(analyze(target * 1.02, DEMIURGE)?.direction).toBe('loosen')
  })

  it('picks the nearer string for a frequency between two strings', () => {
    const low = pitchToFrequency({ note: 'F', octave: 1 })
    const high = pitchToFrequency({ note: 'A#', octave: 1 })
    const nearLow = low * 1.05
    const nearHigh = high * 0.95
    expect(analyze(nearLow, DEMIURGE)?.stringIndex).toBe(0)
    expect(analyze(nearHigh, DEMIURGE)?.stringIndex).toBe(1)
  })

  it('treats offsets within 5 cents as in tune', () => {
    const target = pitchToFrequency({ note: 'G#', octave: 2 })
    const fourCentsSharp = target * 2 ** (4 / 1200)
    expect(analyze(fourCentsSharp, DEMIURGE)?.direction).toBe('in-tune')
  })

  it('returns null for a tuning with no strings', () => {
    expect(analyze(440, tuningOf([]))).toBeNull()
  })
})

describe('analyzeString', () => {
  it('analyzes only the requested string even when another is closer', () => {
    const f1 = pitchToFrequency({ note: 'F', octave: 1 })
    const result = analyzeString(f1, DEMIURGE, 1)
    expect(result?.stringIndex).toBe(1)
    expect(result?.direction).toBe('tighten')
  })

  it('returns null for an out-of-range string index', () => {
    expect(analyzeString(440, DEMIURGE, 9)).toBeNull()
  })
})

describe('analyzeChromatic', () => {
  it('reports in-tune for exact A4', () => {
    expect(analyzeChromatic(440)).toEqual({
      pitch: { note: 'A', octave: 4 },
      cents: 0,
      direction: 'in-tune',
    })
  })

  it('says tighten when flat and loosen when sharp of nearest note', () => {
    const a4 = pitchToFrequency({ note: 'A', octave: 4 })
    expect(analyzeChromatic(a4 * 0.98).direction).toBe('tighten')
    expect(analyzeChromatic(a4 * 1.02).direction).toBe('loosen')
  })

  it('treats offsets within 5 cents as in tune', () => {
    const target = pitchToFrequency({ note: 'E', octave: 2 })
    const fourCentsSharp = target * 2 ** (4 / 1200)
    expect(analyzeChromatic(fourCentsSharp).direction).toBe('in-tune')
  })

  it('picks the nearer note between two semitones', () => {
    const f1 = pitchToFrequency({ note: 'F', octave: 1 })
    const fSharp1 = pitchToFrequency({ note: 'F#', octave: 1 })
    expect(analyzeChromatic(f1 * 1.02).pitch).toEqual({ note: 'F', octave: 1 })
    expect(analyzeChromatic(fSharp1 * 0.98).pitch).toEqual({ note: 'F#', octave: 1 })
  })
})

describe('PRESET_TUNINGS', () => {
  it('orders every preset from lowest string to highest', () => {
    for (const tuning of PRESET_TUNINGS) {
      const freqs = tuning.strings.map((s) => pitchToFrequency(s.pitch))
      const sorted = [...freqs].sort((a, b) => a - b)
      expect(freqs).toEqual(sorted)
    }
  })
})
