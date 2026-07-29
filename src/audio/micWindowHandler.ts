import type { Dispatch, SetStateAction } from 'react'

import { isPitchDetectionSuppressed } from './pitchGate'
import { detectPitch, frequencyJumpCents } from './pitchDetector'
import type { PitchState } from './pitchState'

const MEDIAN_WINDOW = 5
/** Require a few agreeing windows so a single WKWebView hum spike cannot flash. */
const MIN_CONFIRM_READINGS = 3
const MAX_JUMP_CENTS = 150

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? 0
}

function isStableJump(frequency: number, recent: number[]): boolean {
  if (recent.length === 0) {
    return true
  }
  return frequencyJumpCents(median(recent), frequency) <= MAX_JUMP_CENTS
}

export function createMicWindowHandler(
  isActive: () => boolean,
  recent: number[],
  setState: Dispatch<SetStateAction<PitchState>>,
): (samples: Float32Array, sampleRate: number) => void {
  return (samples, sampleRate) => {
    if (!isActive() || isPitchDetectionSuppressed()) {
      return
    }
    const reading = detectPitch(samples, sampleRate)
    if (!reading || !isStableJump(reading.frequency, recent)) {
      recent.length = 0
      setState((prev) => ({ ...prev, frequency: null, clarity: null }))
      return
    }
    recent.push(reading.frequency)
    while (recent.length > MEDIAN_WINDOW) {
      recent.shift()
    }
    if (recent.length < MIN_CONFIRM_READINGS) {
      setState((prev) => ({ ...prev, frequency: null, clarity: null }))
      return
    }
    setState((prev) => ({
      ...prev,
      frequency: median(recent),
      clarity: reading.clarity,
    }))
  }
}
