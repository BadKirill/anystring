import type { NoteName, Pitch } from '../music'
import type { Instrument, Tuning } from './types'

function pitches(specs: [NoteName, number][]): { pitch: Pitch }[] {
  return specs.map(([note, octave]) => ({ pitch: { note, octave } }))
}

function preset(
  id: string,
  name: string,
  instrument: Instrument,
  specs: [NoteName, number][],
): Tuning {
  return { id, name, instrument, strings: pitches(specs) }
}

export const PRESET_TUNINGS: Tuning[] = [
  preset('guitar-standard', 'Standard E', 'guitar', [
    ['E', 2],
    ['A', 2],
    ['D', 3],
    ['G', 3],
    ['B', 3],
    ['E', 4],
  ]),
  preset('guitar-drop-d', 'Drop D', 'guitar', [
    ['D', 2],
    ['A', 2],
    ['D', 3],
    ['G', 3],
    ['B', 3],
    ['E', 4],
  ]),
  preset('guitar-half-step-down', 'Half-step down', 'guitar', [
    ['D#', 2],
    ['G#', 2],
    ['C#', 3],
    ['F#', 3],
    ['A#', 3],
    ['D#', 4],
  ]),
  preset('guitar-drop-c-sharp', 'Drop C#', 'guitar', [
    ['C#', 2],
    ['G#', 2],
    ['C#', 3],
    ['F#', 3],
    ['A#', 3],
    ['D#', 4],
  ]),
  preset('guitar-drop-c', 'Drop C', 'guitar', [
    ['C', 2],
    ['G', 2],
    ['C', 3],
    ['F', 3],
    ['A', 3],
    ['D', 4],
  ]),
  preset('bass-standard-4', 'Standard (4-string)', 'bass', [
    ['E', 1],
    ['A', 1],
    ['D', 2],
    ['G', 2],
  ]),
  preset('bass-drop-d', 'Drop D (4-string)', 'bass', [
    ['D', 1],
    ['A', 1],
    ['D', 2],
    ['G', 2],
  ]),
  preset('bass-standard-5', 'Standard (5-string)', 'bass', [
    ['B', 0],
    ['E', 1],
    ['A', 1],
    ['D', 2],
    ['G', 2],
  ]),
]

export const DEFAULT_TUNING_ID = 'guitar-standard'
