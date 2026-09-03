import { frequencyToMidiFloat } from './frequency'
import { midiToPitch, type Pitch } from './notes'

export function nearestPitch(frequency: number): Pitch {
  return midiToPitch(frequencyToMidiFloat(frequency))
}
