import { describe, expect, it } from 'vitest'

import { PRESET_TUNINGS } from './presets'
import type { Tuning } from './types'

function presetById(id: string): Tuning {
  const tuning = PRESET_TUNINGS.find((entry) => entry.id === id)
  if (tuning === undefined) {
    throw new Error(`missing preset ${id}`)
  }
  return tuning
}

function pitchesOf(tuning: Tuning) {
  return tuning.strings.map((string) => string.pitch)
}

describe('PRESET_TUNINGS', () => {
  it('includes standard 7-string guitar B1–E4', () => {
    const tuning = presetById('guitar-standard-7')
    expect(tuning.name).toBe('Standard (7-string)')
    expect(tuning.instrument).toBe('guitar')
    expect(pitchesOf(tuning)).toEqual([
      { note: 'B', octave: 1 },
      { note: 'E', octave: 2 },
      { note: 'A', octave: 2 },
      { note: 'D', octave: 3 },
      { note: 'G', octave: 3 },
      { note: 'B', octave: 3 },
      { note: 'E', octave: 4 },
    ])
  })

  it('includes standard 8-string guitar F#1–E4', () => {
    const tuning = presetById('guitar-standard-8')
    expect(tuning.name).toBe('Standard (8-string)')
    expect(tuning.instrument).toBe('guitar')
    expect(pitchesOf(tuning)).toEqual([
      { note: 'F#', octave: 1 },
      { note: 'B', octave: 1 },
      { note: 'E', octave: 2 },
      { note: 'A', octave: 2 },
      { note: 'D', octave: 3 },
      { note: 'G', octave: 3 },
      { note: 'B', octave: 3 },
      { note: 'E', octave: 4 },
    ])
  })
})
