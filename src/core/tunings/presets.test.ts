import { describe, expect, it } from 'vitest'

import { pitchToFrequency } from '../music'
import { PRESET_TUNINGS, presetsFor, toggleExpandedInstruments } from './presets'
import { INSTRUMENTS, type Instrument, type Tuning } from './types'

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

  it('toggles independent instrument expansion', () => {
    expect(toggleExpandedInstruments(['guitar'], 'guitar')).toEqual([])
    expect(toggleExpandedInstruments(['guitar'], 'ukulele')).toEqual([
      'guitar',
      'ukulele',
    ])
    expect(toggleExpandedInstruments([], 'bass')).toEqual(['bass'])
    expect(toggleExpandedInstruments(['guitar', 'ukulele'], 'guitar')).toEqual([
      'ukulele',
    ])
    expect(toggleExpandedInstruments(['guitar', 'bass'], 'ukulele')).toEqual([
      'guitar',
      'bass',
      'ukulele',
    ])
  })

  it('lists fretted instruments, then violin, viola, cello, and double bass', () => {
    expect(INSTRUMENTS).toEqual([
      'guitar',
      'bass',
      'ukulele',
      'violin',
      'viola',
      'cello',
      'double-bass',
    ])
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

  it('EC-preset-band keeps every preset string inside 25–1000 Hz', () => {
    for (const tuning of PRESET_TUNINGS) {
      for (const string of tuning.strings) {
        const hz = pitchToFrequency(string.pitch)
        expect(hz).toBeGreaterThanOrEqual(25)
        expect(hz).toBeLessThanOrEqual(1000)
      }
    }
  })

  it('includes standard and known alternate bowed-string tunings', () => {
    const expected: {
      id: string
      name: string
      instrument: Instrument
      pitches: { note: string; octave: number }[]
    }[] = [
      {
        id: 'violin-standard',
        name: 'Standard',
        instrument: 'violin',
        pitches: [
          { note: 'G', octave: 3 },
          { note: 'D', octave: 4 },
          { note: 'A', octave: 4 },
          { note: 'E', octave: 5 },
        ],
      },
      {
        id: 'violin-cross-a',
        name: 'Cross A',
        instrument: 'violin',
        pitches: [
          { note: 'A', octave: 3 },
          { note: 'E', octave: 4 },
          { note: 'A', octave: 4 },
          { note: 'E', octave: 5 },
        ],
      },
      {
        id: 'violin-sawmill',
        name: 'Sawmill',
        instrument: 'violin',
        pitches: [
          { note: 'G', octave: 3 },
          { note: 'D', octave: 4 },
          { note: 'G', octave: 4 },
          { note: 'D', octave: 5 },
        ],
      },
      {
        id: 'violin-d-modal',
        name: 'D modal',
        instrument: 'violin',
        pitches: [
          { note: 'D', octave: 3 },
          { note: 'D', octave: 4 },
          { note: 'A', octave: 4 },
          { note: 'D', octave: 5 },
        ],
      },
      {
        id: 'violin-high-bass',
        name: 'High bass',
        instrument: 'violin',
        pitches: [
          { note: 'A', octave: 3 },
          { note: 'D', octave: 4 },
          { note: 'A', octave: 4 },
          { note: 'E', octave: 5 },
        ],
      },
      {
        id: 'violin-g-modal',
        name: 'G modal',
        instrument: 'violin',
        pitches: [
          { note: 'G', octave: 3 },
          { note: 'D', octave: 4 },
          { note: 'A', octave: 4 },
          { note: 'D', octave: 5 },
        ],
      },
      {
        id: 'violin-calico',
        name: 'Calico',
        instrument: 'violin',
        pitches: [
          { note: 'A', octave: 3 },
          { note: 'E', octave: 4 },
          { note: 'A', octave: 4 },
          { note: 'C#', octave: 5 },
        ],
      },
      {
        id: 'viola-standard',
        name: 'Standard',
        instrument: 'viola',
        pitches: [
          { note: 'C', octave: 3 },
          { note: 'G', octave: 3 },
          { note: 'D', octave: 4 },
          { note: 'A', octave: 4 },
        ],
      },
      {
        id: 'viola-five-string',
        name: 'Five-string',
        instrument: 'viola',
        pitches: [
          { note: 'C', octave: 3 },
          { note: 'G', octave: 3 },
          { note: 'D', octave: 4 },
          { note: 'A', octave: 4 },
          { note: 'E', octave: 5 },
        ],
      },
      {
        id: 'viola-violin-pitch',
        name: 'Violin pitch',
        instrument: 'viola',
        pitches: [
          { note: 'G', octave: 3 },
          { note: 'D', octave: 4 },
          { note: 'A', octave: 4 },
          { note: 'E', octave: 5 },
        ],
      },
      {
        id: 'viola-cross-da',
        name: 'Cross D-A',
        instrument: 'viola',
        pitches: [
          { note: 'D', octave: 3 },
          { note: 'A', octave: 3 },
          { note: 'D', octave: 4 },
          { note: 'A', octave: 4 },
        ],
      },
      {
        id: 'cello-standard',
        name: 'Standard',
        instrument: 'cello',
        pitches: [
          { note: 'C', octave: 2 },
          { note: 'G', octave: 2 },
          { note: 'D', octave: 3 },
          { note: 'A', octave: 3 },
        ],
      },
      {
        id: 'cello-five-string',
        name: 'Five-string',
        instrument: 'cello',
        pitches: [
          { note: 'C', octave: 2 },
          { note: 'G', octave: 2 },
          { note: 'D', octave: 3 },
          { note: 'A', octave: 3 },
          { note: 'E', octave: 4 },
        ],
      },
      {
        id: 'cello-bach-5',
        name: 'Bach Suite V',
        instrument: 'cello',
        pitches: [
          { note: 'C', octave: 2 },
          { note: 'G', octave: 2 },
          { note: 'D', octave: 3 },
          { note: 'G', octave: 3 },
        ],
      },
      {
        id: 'cello-kodaly',
        name: 'Kodaly',
        instrument: 'cello',
        pitches: [
          { note: 'B', octave: 1 },
          { note: 'F#', octave: 2 },
          { note: 'D', octave: 3 },
          { note: 'A', octave: 3 },
        ],
      },
      {
        id: 'double-bass-standard',
        name: 'Standard',
        instrument: 'double-bass',
        pitches: [
          { note: 'E', octave: 1 },
          { note: 'A', octave: 1 },
          { note: 'D', octave: 2 },
          { note: 'G', octave: 2 },
        ],
      },
      {
        id: 'double-bass-solo',
        name: 'Solo',
        instrument: 'double-bass',
        pitches: [
          { note: 'F#', octave: 1 },
          { note: 'B', octave: 1 },
          { note: 'E', octave: 2 },
          { note: 'A', octave: 2 },
        ],
      },
      {
        id: 'double-bass-five-b',
        name: 'Five-string (low B)',
        instrument: 'double-bass',
        pitches: [
          { note: 'B', octave: 0 },
          { note: 'E', octave: 1 },
          { note: 'A', octave: 1 },
          { note: 'D', octave: 2 },
          { note: 'G', octave: 2 },
        ],
      },
      {
        id: 'double-bass-low-c',
        name: 'Low C',
        instrument: 'double-bass',
        pitches: [
          { note: 'C', octave: 1 },
          { note: 'E', octave: 1 },
          { note: 'A', octave: 1 },
          { note: 'D', octave: 2 },
          { note: 'G', octave: 2 },
        ],
      },
      {
        id: 'double-bass-fifths',
        name: 'Fifths',
        instrument: 'double-bass',
        pitches: [
          { note: 'C', octave: 1 },
          { note: 'G', octave: 1 },
          { note: 'D', octave: 2 },
          { note: 'A', octave: 2 },
        ],
      },
      {
        id: 'double-bass-drop-d',
        name: 'Drop D',
        instrument: 'double-bass',
        pitches: [
          { note: 'D', octave: 1 },
          { note: 'A', octave: 1 },
          { note: 'D', octave: 2 },
          { note: 'G', octave: 2 },
        ],
      },
    ]

    for (const entry of expected) {
      const tuning = presetById(entry.id)
      expect(tuning.name).toBe(entry.name)
      expect(tuning.instrument).toBe(entry.instrument)
      expect(pitchesOf(tuning)).toEqual(entry.pitches)
    }
    expect(presetsFor('violin')).toHaveLength(7)
    expect(presetsFor('viola')).toHaveLength(4)
    expect(presetsFor('cello')).toHaveLength(4)
    expect(presetsFor('double-bass')).toHaveLength(6)
  })
})
