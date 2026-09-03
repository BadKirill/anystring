import { centsBetween, nearestPitch, pitchToFrequency, type Pitch } from '../music'
import type { Tuning } from './types'

export type TuneDirection = 'tighten' | 'loosen' | 'in-tune'

export interface StringAnalysis {
  stringIndex: number

  cents: number
  direction: TuneDirection
}

export interface ChromaticAnalysis {
  pitch: Pitch

  cents: number
  direction: TuneDirection
}

export const IN_TUNE_CENTS = 5

function directionFor(cents: number): TuneDirection {
  if (Math.abs(cents) <= IN_TUNE_CENTS) {
    return 'in-tune'
  }
  return cents < 0 ? 'tighten' : 'loosen'
}

export function analyzeString(
  frequency: number,
  tuning: Tuning,
  stringIndex: number,
): StringAnalysis | null {
  const string = tuning.strings[stringIndex]
  if (!string) {
    return null
  }
  const cents = centsBetween(frequency, pitchToFrequency(string.pitch))
  return { stringIndex, cents, direction: directionFor(cents) }
}

export function analyze(frequency: number, tuning: Tuning): StringAnalysis | null {
  let best: { index: number; cents: number } | null = null
  for (const [index, string] of tuning.strings.entries()) {
    const cents = centsBetween(frequency, pitchToFrequency(string.pitch))
    if (!best || Math.abs(cents) < Math.abs(best.cents)) {
      best = { index, cents }
    }
  }
  if (!best) {
    return null
  }
  return {
    stringIndex: best.index,
    cents: best.cents,
    direction: directionFor(best.cents),
  }
}

export function analyzeChromatic(frequency: number): ChromaticAnalysis {
  const pitch = nearestPitch(frequency)
  const cents = centsBetween(frequency, pitchToFrequency(pitch))
  return { pitch, cents, direction: directionFor(cents) }
}
