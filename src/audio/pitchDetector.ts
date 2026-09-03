import { PitchDetector } from 'pitchy'

export interface PitchReading {
  frequency: number
  clarity: number
}

const MIN_FREQUENCY_HZ = 25

const MAX_FREQUENCY_HZ = 1000

const MIN_RMS_DEFAULT = 0.005
const MIN_RMS_BELOW_90_HZ = 0.008
const MIN_RMS_BELOW_55_HZ = 0.012

const detectors = new Map<number, PitchDetector<Float32Array>>()

function detectorFor(windowSize: number): PitchDetector<Float32Array> {
  let detector = detectors.get(windowSize)
  if (!detector) {
    detector = PitchDetector.forFloat32Array(windowSize)
    detectors.set(windowSize, detector)
  }
  return detector
}

export function signalRms(samples: Float32Array): number {
  let sum = 0
  for (const sample of samples) {
    sum += sample * sample
  }
  return Math.sqrt(sum / samples.length)
}

export function removeDc(samples: Float32Array): Float32Array {
  let sum = 0
  for (const sample of samples) {
    sum += sample
  }
  const mean = sum / samples.length
  if (mean === 0) {
    return samples
  }
  const out = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i += 1) {
    const sample = samples[i]
    out[i] = sample === undefined ? 0 : sample - mean
  }
  return out
}

export function minClarityFor(frequency: number): number {
  if (frequency < 60) {
    return 0.88
  }
  if (frequency < 100) {
    return 0.88
  }
  return 0.9
}

export function minRmsFor(frequency: number): number {
  if (frequency < 55) {
    return MIN_RMS_BELOW_55_HZ
  }
  if (frequency < 90) {
    return MIN_RMS_BELOW_90_HZ
  }
  return MIN_RMS_DEFAULT
}

export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
): PitchReading | null {
  const rms = signalRms(samples)

  if (rms < MIN_RMS_DEFAULT) {
    return null
  }
  const centered = removeDc(samples)
  const [frequency, clarity] = detectorFor(centered.length).findPitch(
    centered,
    sampleRate,
  )
  const usable =
    clarity >= minClarityFor(frequency) &&
    rms >= minRmsFor(frequency) &&
    frequency >= MIN_FREQUENCY_HZ &&
    frequency <= MAX_FREQUENCY_HZ
  return usable ? { frequency, clarity } : null
}

export function frequencyJumpCents(fromHz: number, toHz: number): number {
  return Math.abs(1200 * Math.log2(toHz / fromHz))
}
