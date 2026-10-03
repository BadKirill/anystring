import { PLUCK_VOICES, type PluckVoice, type Resonator } from './pluckVoice'

interface Partial {
  readonly hz: number
  readonly amp: number
  readonly decayS: number
}

// The written note is the first partial, unstretched, so a tuner preview
// cannot drift sharp the way a stiff string's upper partials do.
function partialFrequency(
  fundamental: number,
  harmonic: number,
  inharmonicity: number,
): number {
  if (harmonic === 1) {
    return fundamental
  }
  const stretch = Math.sqrt(1 + inharmonicity * harmonic * harmonic)
  return fundamental * harmonic * stretch
}

function peakingGain(sampleRate: number, resonator: Resonator, atHz: number): number {
  const amplitude = 10 ** (resonator.db / 40)
  const omega = (2 * Math.PI * resonator.hz) / sampleRate
  const alpha = Math.sin(omega) / (2 * resonator.q)
  const cosine = Math.cos(omega)
  const b0 = 1 + alpha * amplitude
  const b1 = -2 * cosine
  const b2 = 1 - alpha * amplitude
  const a0 = 1 + alpha / amplitude
  const a1 = -2 * cosine
  const a2 = 1 - alpha / amplitude
  const w = (2 * Math.PI * atHz) / sampleRate
  const real1 = Math.cos(w)
  const imag1 = -Math.sin(w)
  const real2 = Math.cos(2 * w)
  const imag2 = -Math.sin(2 * w)
  const numReal = b0 + b1 * real1 + b2 * real2
  const numImag = b1 * imag1 + b2 * imag2
  const denReal = a0 + a1 * real1 + a2 * real2
  const denImag = a1 * imag1 + a2 * imag2
  return Math.hypot(numReal, numImag) / Math.hypot(denReal, denImag)
}

function bodyGain(sampleRate: number, atHz: number, voice: PluckVoice): number {
  let gain = 1
  for (const resonator of voice.body) {
    gain *= peakingGain(sampleRate, resonator, atHz)
  }
  return gain
}

function partialAmplitude(
  harmonic: number,
  hz: number,
  sampleRate: number,
  voice: PluckVoice,
): number {
  const node = Math.abs(Math.sin(Math.PI * harmonic * voice.pick))
  return (node / harmonic ** voice.slope) * bodyGain(sampleRate, hz, voice)
}

function withClearFundamental(partials: readonly Partial[]): Partial[] {
  const fundamental = partials[0]
  if (fundamental === undefined) {
    return []
  }
  let loudestOvertone = 0
  for (const partial of partials) {
    if (partial !== fundamental) {
      loudestOvertone = Math.max(loudestOvertone, partial.amp)
    }
  }
  const ceiling = fundamental.amp * 0.58
  if (loudestOvertone <= ceiling || loudestOvertone === 0) {
    return [...partials]
  }
  const scale = ceiling / loudestOvertone
  return partials.map((partial) =>
    partial === fundamental ? partial : { ...partial, amp: partial.amp * scale },
  )
}

function partialsFor(
  frequency: number,
  sampleRate: number,
  voice: PluckVoice,
): Partial[] {
  const partials: Partial[] = []
  const nyquist = sampleRate * 0.45
  for (let harmonic = 1; harmonic <= voice.maxHarm; harmonic += 1) {
    const hz = partialFrequency(frequency, harmonic, voice.inharmonicity)
    if (hz >= nyquist) {
      break
    }
    partials.push({
      hz,
      amp: partialAmplitude(harmonic, hz, sampleRate, voice),
      decayS: voice.decayS / (1 + voice.harmDecay * (harmonic - 1)),
    })
  }
  return withClearFundamental(partials)
}

function addPartial(
  out: Float32Array,
  partial: Partial,
  sampleRate: number,
  attackS: number,
): void {
  const omega = (2 * Math.PI * partial.hz) / sampleRate
  const phase = Math.random() * Math.PI * 2
  const riseS = Math.max(attackS, 0.001)
  for (let i = 0; i < out.length; i += 1) {
    const t = i / sampleRate
    const env = (1 - Math.exp(-t / riseS)) * Math.exp(-t / partial.decayS)
    out[i] = (out[i] ?? 0) + Math.sin(omega * i + phase) * partial.amp * env
  }
}

function renderPartials(
  partials: readonly Partial[],
  sampleRate: number,
  length: number,
  attackS: number,
): Float32Array {
  const out = new Float32Array(length)
  for (const partial of partials) {
    addPartial(out, partial, sampleRate, attackS)
  }
  return out
}

function addBodyThump(out: Float32Array, sampleRate: number, voice: PluckVoice): void {
  const length = Math.min(out.length, Math.floor(sampleRate * voice.thumpDecayS * 4))
  const omega = (2 * Math.PI * voice.thumpHz) / sampleRate
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate
    const env = Math.exp(-t / voice.thumpDecayS) * (1 - Math.exp(-t / 0.003))
    out[i] = (out[i] ?? 0) + Math.sin(omega * i) * voice.thump * env
  }
}

function addPickNoise(
  out: Float32Array,
  sampleRate: number,
  amount: number,
  noiseS: number,
): void {
  const length = Math.min(out.length, Math.floor(sampleRate * noiseS))
  let previous = 0
  for (let i = 0; i < length; i += 1) {
    const env = (1 - i / length) ** 2
    const click = (Math.random() * 2 - 1) * env
    const highpass = click - previous * 0.82
    previous = click
    out[i] = (out[i] ?? 0) + highpass * amount
  }
}

function fadeTail(out: Float32Array, sampleRate: number, releaseS: number): void {
  const fade = Math.min(out.length, Math.max(1, Math.floor(sampleRate * releaseS)))
  const start = out.length - fade
  for (let i = 0; i < fade; i += 1) {
    const index = start + i
    out[index] = (out[index] ?? 0) * (1 - i / fade)
  }
}

export function synthesizePluck(
  frequency: number,
  sampleRate: number,
  durationS: number,
  voice: PluckVoice = PLUCK_VOICES.guitar,
): Float32Array {
  const length = Math.max(0, Math.floor(sampleRate * durationS))
  if (length === 0 || !Number.isFinite(frequency) || frequency <= 0) {
    return new Float32Array(length)
  }
  const out = renderPartials(
    partialsFor(frequency, sampleRate, voice),
    sampleRate,
    length,
    voice.attackMs / 1000,
  )
  addBodyThump(out, sampleRate, voice)
  addPickNoise(out, sampleRate, voice.noise, voice.noiseS)
  fadeTail(out, sampleRate, voice.releaseS)
  return out
}

export function normalizePluck(samples: Float32Array, targetPeak = 0.85): Float32Array {
  let peak = 0
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample))
  }
  if (peak < 1e-6) {
    return samples
  }
  const scale = targetPeak / peak
  const out = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i += 1) {
    out[i] = (samples[i] ?? 0) * scale
  }
  return out
}
