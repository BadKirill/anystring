export const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

export type NoteName = (typeof NOTE_NAMES)[number]

export interface Pitch {
  note: NoteName
  octave: number
}

const SEMITONES_PER_OCTAVE = 12

const MIDI_C0 = 12

export function pitchToMidi(pitch: Pitch): number {
  return MIDI_C0 + pitch.octave * SEMITONES_PER_OCTAVE + NOTE_NAMES.indexOf(pitch.note)
}

export function midiToPitch(midi: number): Pitch {
  const rounded = Math.round(midi)
  const semitonesFromC0 = rounded - MIDI_C0
  const octave = Math.floor(semitonesFromC0 / SEMITONES_PER_OCTAVE)
  const index = semitonesFromC0 - octave * SEMITONES_PER_OCTAVE
  const note = NOTE_NAMES[index]
  if (note === undefined) {
    throw new Error(`MIDI number out of range: ${String(midi)}`)
  }
  return { note, octave }
}

export function formatPitch(pitch: Pitch): string {
  return `${pitch.note}${String(pitch.octave)}`
}

export function pitchesEqual(a: Pitch, b: Pitch): boolean {
  return a.note === b.note && a.octave === b.octave
}
