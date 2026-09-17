import { describe, expect, it } from 'vitest'

import { PRESET_TUNINGS, presetsFor, toggleExclusiveInstrument } from './presets'
import { INSTRUMENTS, type Tuning } from './types'

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

  it('toggles exclusive instrument expansion', () => {
    expect(toggleExclusiveInstrument('guitar', 'guitar')).toBeNull()
    expect(toggleExclusiveInstrument('guitar', 'ukulele')).toBe('ukulele')
    expect(toggleExclusiveInstrument(null, 'bass')).toBe('bass')
  })

  it('lists guitar, bass, then ukulele for the picker', () => {
    expect(INSTRUMENTS).toEqual(['guitar', 'bass', 'ukulele'])
  })

  it('groups presets by instrument', () => {
    for (const instrument of INSTRUMENTS) {
      expect(
        presetsFor(instrument).every((tuning) => tuning.instrument === instrument),
      ).toBe(true)
    }
    expect(presetsFor('ukulele')).toHaveLength(5)
  })

  it('includes ukulele High G, Low G, D tuning, Baritone, and Open C', () => {
    const expected = [
      {
        id: 'ukulele-standard',
        name: 'Standard (High G)',
        pitches: [
          { note: 'G', octave: 4 },
          { note: 'C', octave: 4 },
          { note: 'E', octave: 4 },
          { note: 'A', octave: 4 },
        ],
      },
      {
        id: 'ukulele-low-g',
        name: 'Low G',
        pitches: [
          { note: 'G', octave: 3 },
          { note: 'C', octave: 4 },
          { note: 'E', octave: 4 },
          { note: 'A', octave: 4 },
        ],
      },
      {
        id: 'ukulele-d',
        name: 'D tuning',
        pitches: [
          { note: 'A', octave: 4 },
          { note: 'D', octave: 4 },
          { note: 'F#', octave: 4 },
          { note: 'B', octave: 4 },
        ],
      },
      {
        id: 'ukulele-baritone',
        name: 'Baritone',
        pitches: [
          { note: 'D', octave: 3 },
          { note: 'G', octave: 3 },
          { note: 'B', octave: 3 },
          { note: 'E', octave: 4 },
        ],
      },
      {
        id: 'ukulele-open-c',
        name: 'Open C',
        pitches: [
          { note: 'G', octave: 4 },
          { note: 'C', octave: 4 },
          { note: 'E', octave: 4 },
          { note: 'G', octave: 4 },
        ],
      },
    ] as const

    for (const entry of expected) {
      const tuning = presetById(entry.id)
      expect(tuning.name).toBe(entry.name)
      expect(tuning.instrument).toBe('ukulele')
      expect(pitchesOf(tuning)).toEqual([...entry.pitches])
    }
  })
})
