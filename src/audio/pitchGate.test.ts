import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isPitchDetectionSuppressed, suppressPitchDetection } from './pitchGate'

describe('pitchGate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.advanceTimersByTime(1_000_000)
  })

  afterEach(() => {
    vi.advanceTimersByTime(60_000)
    vi.useRealTimers()
  })

  it('EC-suppress-window suppresses detection until the duration elapses and later calls can extend it', () => {
    expect(isPitchDetectionSuppressed()).toBe(false)
    suppressPitchDetection(200)
    expect(isPitchDetectionSuppressed()).toBe(true)
    vi.advanceTimersByTime(199)
    expect(isPitchDetectionSuppressed()).toBe(true)
    vi.advanceTimersByTime(1)
    expect(isPitchDetectionSuppressed()).toBe(false)

    suppressPitchDetection(50)
    vi.advanceTimersByTime(40)
    suppressPitchDetection(100)
    vi.advanceTimersByTime(90)
    expect(isPitchDetectionSuppressed()).toBe(true)
    vi.advanceTimersByTime(10)
    expect(isPitchDetectionSuppressed()).toBe(false)
  })
})
