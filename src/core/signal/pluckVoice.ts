import type { Instrument } from '../tunings/types'

export type PluckInstrument = Instrument

export interface Resonator {
  readonly hz: number
  readonly q: number
  readonly db: number
}

// Differences live here so the synth has no per-instrument branches.
// `durationS` is how long the preview rings; decay numbers shape the tone.
export interface PluckVoice {
  readonly pick: number
  readonly slope: number
  readonly inharmonicity: number
  readonly decayS: number
  readonly harmDecay: number
  readonly attackMs: number
  readonly thumpHz: number
  readonly thump: number
  readonly thumpDecayS: number
  readonly noise: number
  readonly noiseS: number
  readonly releaseS: number
  readonly maxHarm: number
  readonly durationS: number
  readonly body: readonly [Resonator, Resonator, Resonator]
}

export const PLUCK_VOICES: Record<Instrument, PluckVoice> = {
  guitar: {
    pick: 0.18,
    slope: 1.2,
    inharmonicity: 0.00005,
    decayS: 1.45,
    harmDecay: 0.11,
    attackMs: 2.4,
    thumpHz: 102,
    thump: 0.11,
    thumpDecayS: 0.06,
    noise: 0.07,
    noiseS: 0.01,
    releaseS: 0.018,
    maxHarm: 16,
    durationS: 1.65,
    body: [
      { hz: 100, q: 1.5, db: 6 },
      { hz: 196, q: 1.15, db: 4 },
      { hz: 2400, q: 0.8, db: 2.5 },
    ],
  },
  bass: {
    pick: 0.36,
    slope: 1.9,
    inharmonicity: 0.00005,
    decayS: 2.15,
    harmDecay: 0.2,
    attackMs: 5,
    thumpHz: 68,
    thump: 0.14,
    thumpDecayS: 0.08,
    noise: 0.045,
    noiseS: 0.01,
    releaseS: 0.02,
    maxHarm: 8,
    durationS: 2.2,
    body: [
      { hz: 68, q: 1.3, db: 7 },
      { hz: 128, q: 0.95, db: 3 },
      { hz: 380, q: 0.7, db: 1.2 },
    ],
  },
  ukulele: {
    pick: 0.13,
    slope: 0.95,
    inharmonicity: 0.00002,
    decayS: 0.78,
    harmDecay: 0.13,
    attackMs: 1.6,
    thumpHz: 280,
    thump: 0.08,
    thumpDecayS: 0.045,
    noise: 0.1,
    noiseS: 0.008,
    releaseS: 0.016,
    maxHarm: 14,
    durationS: 1.05,
    body: [
      { hz: 275, q: 1.35, db: 5.5 },
      { hz: 470, q: 1.05, db: 3 },
      { hz: 3000, q: 0.75, db: 3.2 },
    ],
  },
  violin: {
    pick: 0.24,
    slope: 1.02,
    inharmonicity: 0.00001,
    decayS: 6.4,
    harmDecay: 0.045,
    attackMs: 46,
    thumpHz: 285,
    thump: 0.035,
    thumpDecayS: 0.04,
    noise: 0.028,
    noiseS: 0.03,
    releaseS: 0.16,
    maxHarm: 18,
    durationS: 1.75,
    body: [
      { hz: 280, q: 1.4, db: 5 },
      { hz: 460, q: 1.1, db: 3.5 },
      { hz: 2700, q: 0.75, db: 3.4 },
    ],
  },
  viola: {
    pick: 0.26,
    slope: 1.12,
    inharmonicity: 0.00001,
    decayS: 6.2,
    harmDecay: 0.06,
    attackMs: 55,
    thumpHz: 230,
    thump: 0.04,
    thumpDecayS: 0.045,
    noise: 0.024,
    noiseS: 0.032,
    releaseS: 0.16,
    maxHarm: 14,
    durationS: 1.8,
    body: [
      { hz: 230, q: 1.3, db: 4.5 },
      { hz: 360, q: 1.05, db: 2.4 },
      { hz: 2200, q: 0.7, db: 2.4 },
    ],
  },
  cello: {
    pick: 0.32,
    slope: 1.85,
    inharmonicity: 0.000015,
    decayS: 7,
    harmDecay: 0.07,
    attackMs: 62,
    thumpHz: 102,
    thump: 0.05,
    thumpDecayS: 0.05,
    noise: 0.022,
    noiseS: 0.034,
    releaseS: 0.18,
    maxHarm: 9,
    durationS: 1.95,
    body: [
      { hz: 98, q: 1.25, db: 6 },
      { hz: 175, q: 1, db: 3.2 },
      { hz: 520, q: 0.7, db: 1.4 },
    ],
  },
  'double-bass': {
    pick: 0.38,
    slope: 2.05,
    inharmonicity: 0.00002,
    decayS: 7.5,
    harmDecay: 0.12,
    attackMs: 78,
    thumpHz: 62,
    thump: 0.06,
    thumpDecayS: 0.05,
    noise: 0.018,
    noiseS: 0.04,
    releaseS: 0.2,
    maxHarm: 8,
    durationS: 2.15,
    body: [
      { hz: 62, q: 1.2, db: 6.5 },
      { hz: 108, q: 0.95, db: 2.8 },
      { hz: 260, q: 0.65, db: 1 },
    ],
  },
}
