import type { Dispatch, SetStateAction } from 'react'

import { isPitchDetectionSuppressed } from './pitchGate'
import { detectPitch, frequencyJumpCents, type PitchReading } from './pitchDetector'
import type { PitchState } from './pitchState'

const MEDIAN_WINDOW = 5

const MIN_CONFIRM_READINGS = 3
const MAX_JUMP_CENTS = 150
const MAX_OUTLIERS = 2

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

function blankPitch(setState: Dispatch<SetStateAction<PitchState>>): void {
  setState((prev) => ({ ...prev, frequency: null, clarity: null }))
}

function publishReading(
  recent: number[],
  reading: PitchReading,
  setState: Dispatch<SetStateAction<PitchState>>,
): void {
  recent.push(reading.frequency)
  while (recent.length > MEDIAN_WINDOW) {
    recent.shift()
  }
  if (recent.length < MIN_CONFIRM_READINGS) {
    blankPitch(setState)
    return
  }
  setState((prev) => ({
    ...prev,
    frequency: median(recent),
    clarity: reading.clarity,
  }))
}

export function createMicWindowHandler(
  isActive: () => boolean,
  recent: number[],
  setState: Dispatch<SetStateAction<PitchState>>,
): (samples: Float32Array, sampleRate: number) => void {
  let outliers = 0
  const drop = (): void => {
    recent.length = 0
    outliers = 0
    blankPitch(setState)
  }
  return (samples, sampleRate) => {
    if (!isActive()) {
      return
    }
    if (isPitchDetectionSuppressed()) {
      drop()
      return
    }
    const reading = detectPitch(samples, sampleRate)
    if (!reading) {
      drop()
      return
    }
    if (!isStableJump(reading.frequency, recent)) {
      outliers += 1
      if (outliers >= MAX_OUTLIERS) {
        drop()
      }
      return
    }
    outliers = 0
    publishReading(recent, reading, setState)
  }
}
