import type { Pitch } from '../music'

export type Instrument = 'guitar' | 'bass'

export interface InstrumentString {
  pitch: Pitch
}

export interface Tuning {
  id: string
  name: string
  instrument: Instrument

  strings: InstrumentString[]
}
