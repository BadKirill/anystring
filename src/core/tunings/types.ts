import type { Pitch } from '../music'

export type Instrument = 'guitar' | 'bass' | 'ukulele'

export const INSTRUMENTS: readonly Instrument[] = ['guitar', 'bass', 'ukulele']

export function isInstrument(value: unknown): value is Instrument {
  return INSTRUMENTS.some((instrument) => instrument === value)
}

export interface InstrumentString {
  pitch: Pitch
}

export interface Tuning {
  id: string
  name: string
  instrument: Instrument

  strings: InstrumentString[]
}
