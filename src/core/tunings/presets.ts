import type { NoteName, Pitch } from '../music'
import { INSTRUMENTS, type Instrument, type Tuning } from './types'

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
  preset('violin-standard', 'Standard', 'violin', [
    ['G', 3],
    ['D', 4],
    ['A', 4],
    ['E', 5],
  ]),
  preset('violin-cross-a', 'Cross A', 'violin', [
    ['A', 3],
    ['E', 4],
    ['A', 4],
    ['E', 5],
  ]),
  preset('violin-sawmill', 'Sawmill', 'violin', [
    ['G', 3],
    ['D', 4],
    ['G', 4],
    ['D', 5],
  ]),
  preset('violin-d-modal', 'D modal', 'violin', [
    ['D', 3],
    ['D', 4],
    ['A', 4],
    ['D', 5],
  ]),
  preset('violin-high-bass', 'High bass', 'violin', [
    ['A', 3],
    ['D', 4],
    ['A', 4],
    ['E', 5],
  ]),
  preset('violin-g-modal', 'G modal', 'violin', [
    ['G', 3],
    ['D', 4],
    ['A', 4],
    ['D', 5],
  ]),
  preset('violin-calico', 'Calico', 'violin', [
    ['A', 3],
    ['E', 4],
    ['A', 4],
    ['C#', 5],
  ]),
  preset('viola-standard', 'Standard', 'viola', [
    ['C', 3],
    ['G', 3],
    ['D', 4],
    ['A', 4],
  ]),
  preset('viola-five-string', 'Five-string', 'viola', [
    ['C', 3],
    ['G', 3],
    ['D', 4],
    ['A', 4],
    ['E', 5],
  ]),
  preset('viola-violin-pitch', 'Violin pitch', 'viola', [
    ['G', 3],
    ['D', 4],
    ['A', 4],
    ['E', 5],
  ]),
  preset('viola-cross-da', 'Cross D-A', 'viola', [
    ['D', 3],
    ['A', 3],
    ['D', 4],
    ['A', 4],
  ]),
  preset('cello-standard', 'Standard', 'cello', [
    ['C', 2],
    ['G', 2],
    ['D', 3],
    ['A', 3],
  ]),
  preset('cello-five-string', 'Five-string', 'cello', [
    ['C', 2],
    ['G', 2],
    ['D', 3],
    ['A', 3],
    ['E', 4],
  ]),
  preset('cello-bach-5', 'Bach Suite V', 'cello', [
    ['C', 2],
    ['G', 2],
    ['D', 3],
    ['G', 3],
  ]),
  preset('cello-kodaly', 'Kodaly', 'cello', [
    ['B', 1],
    ['F#', 2],
    ['D', 3],
    ['A', 3],
  ]),
  preset('double-bass-standard', 'Standard', 'double-bass', [
    ['E', 1],
    ['A', 1],
    ['D', 2],
    ['G', 2],
  ]),
  preset('double-bass-solo', 'Solo', 'double-bass', [
    ['F#', 1],
    ['B', 1],
    ['E', 2],
    ['A', 2],
  ]),
  preset('double-bass-five-b', 'Five-string (low B)', 'double-bass', [
    ['B', 0],
    ['E', 1],
    ['A', 1],
    ['D', 2],
    ['G', 2],
  ]),
  preset('double-bass-low-c', 'Low C', 'double-bass', [
    ['C', 1],
    ['E', 1],
    ['A', 1],
    ['D', 2],
    ['G', 2],
  ]),
  preset('double-bass-fifths', 'Fifths', 'double-bass', [
    ['C', 1],
    ['G', 1],
    ['D', 2],
    ['A', 2],
  ]),
  preset('double-bass-drop-d', 'Drop D', 'double-bass', [
    ['D', 1],
    ['A', 1],
    ['D', 2],
    ['G', 2],
  ]),
]

export function presetsFor(instrument: Instrument): Tuning[] {
  return PRESET_TUNINGS.filter((tuning) => tuning.instrument === instrument)
}

export function toggleExpandedInstruments(
  open: readonly Instrument[],
  tapped: Instrument,
): readonly Instrument[] {
  const next = new Set(open)
  if (next.has(tapped)) {
    next.delete(tapped)
  } else {
    next.add(tapped)
  }
  return INSTRUMENTS.filter((instrument) => next.has(instrument))
}

export const DEFAULT_TUNING_ID = 'guitar-standard'
