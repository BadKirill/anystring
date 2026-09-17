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
  preset('guitar-standard-7', 'Standard (7-string)', 'guitar', [
    ['B', 1],
    ['E', 2],
    ['A', 2],
    ['D', 3],
    ['G', 3],
    ['B', 3],
    ['E', 4],
  ]),
  preset('guitar-standard-8', 'Standard (8-string)', 'guitar', [
    ['F#', 1],
    ['B', 1],
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
  preset('ukulele-standard', 'Standard (High G)', 'ukulele', [
    ['G', 4],
    ['C', 4],
    ['E', 4],
    ['A', 4],
  ]),
  preset('ukulele-low-g', 'Low G', 'ukulele', [
    ['G', 3],
    ['C', 4],
    ['E', 4],
    ['A', 4],
  ]),
  preset('ukulele-d', 'D tuning', 'ukulele', [
    ['A', 4],
    ['D', 4],
    ['F#', 4],
    ['B', 4],
  ]),
  preset('ukulele-baritone', 'Baritone', 'ukulele', [
    ['D', 3],
    ['G', 3],
    ['B', 3],
    ['E', 4],
  ]),
  preset('ukulele-open-c', 'Open C', 'ukulele', [
    ['G', 4],
    ['C', 4],
    ['E', 4],
    ['G', 4],
  ]),
]

export function presetsFor(instrument: Instrument): Tuning[] {
  return PRESET_TUNINGS.filter((tuning) => tuning.instrument === instrument)
}

export function toggleExclusiveInstrument(
  current: Instrument | null,
  tapped: Instrument,
): Instrument | null {
  return current === tapped ? null : tapped
}

export const DEFAULT_TUNING_ID = 'guitar-standard'
