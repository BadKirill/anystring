import { PitchDetector } from 'pitchy'

export interface PitchReading {
  frequency: number
  clarity: number
}

/** Below the lowest useful bass note (drop F# on a 5-string is ~23 Hz overtone-rich). */
const MIN_FREQUENCY_HZ = 25
/** Above the highest string fundamental we care about. */
const MAX_FREQUENCY_HZ = 1000

/**
 * Reject near-silence before pitchy runs. WKWebView on iOS often feeds a quiet
 * periodic hum (~40 Hz, high clarity) that is not audible as a string pluck;
 * Android's WebView noise floor does not look like a clean bass tone.
 */
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

/** Root-mean-square amplitude of a window. */
export function signalRms(samples: Float32Array): number {
  let sum = 0
  for (const sample of samples) {
    sum += sample * sample
  }
  return Math.sqrt(sum / samples.length)
}

/** Subtract DC bias so a constant offset cannot look like a sub-bass tone. */
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

/** Bass fundamentals need a slightly lower clarity bar than high strings. */
export function minClarityFor(frequency: number): number {
  if (frequency < 60) {
    return 0.88
  }
  if (frequency < 100) {
    return 0.88
  }
  return 0.9
}

/** Louder floor for low bands — quiet WKWebView hum is clean but tiny. */
export function minRmsFor(frequency: number): number {
  if (frequency < 55) {
    return MIN_RMS_BELOW_55_HZ
  }
  if (frequency < 90) {
    return MIN_RMS_BELOW_90_HZ
  }
  return MIN_RMS_DEFAULT
}

/** Detects the fundamental pitch of a sample window; null if nothing reliable. */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
): PitchReading | null {
  const rms = signalRms(samples)
  // Cheap reject before pitchy: silence and DC-only windows.
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

/** Signed cents distance between two frequencies. */
export function frequencyJumpCents(fromHz: number, toHz: number): number {
  return Math.abs(1200 * Math.log2(toHz / fromHz))
}
