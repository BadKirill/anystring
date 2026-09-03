import { pitchToMidi, type Pitch } from './notes'

const A4_FREQUENCY_HZ = 440
const A4_MIDI = 69
const SEMITONES_PER_OCTAVE = 12

export function midiToFrequency(midi: number): number {
  return A4_FREQUENCY_HZ * 2 ** ((midi - A4_MIDI) / SEMITONES_PER_OCTAVE)
}

export function frequencyToMidiFloat(frequency: number): number {
  return A4_MIDI + SEMITONES_PER_OCTAVE * Math.log2(frequency / A4_FREQUENCY_HZ)
}

export function pitchToFrequency(pitch: Pitch): number {
  return midiToFrequency(pitchToMidi(pitch))
}
