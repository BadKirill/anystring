import { StrictMode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { pulseHaptic } from '../platform/hapticPulse'
import { useStringLock } from './useStringLock'
import type { StringLockInput } from '../core/tunings'

vi.mock('../platform/hapticPulse', () => ({
  pulseHaptic: vi.fn(),
}))

const KEY = 'guitar-standard:40,45,50,55,59,64'

function input(overrides: Partial<StringLockInput> = {}): StringLockInput {
  return {
    tuningKey: KEY,
    screen: 'strings',
    stringIndex: 0,
    inTune: true,
    ...overrides,
  }
}

describe('useStringLock', () => {
  it('pulses once when a string first locks and stays quiet across re-renders', async () => {
    const { result, rerender } = renderHook(
      (props: StringLockInput) => useStringLock(props),
      {
        initialProps: input(),
      },
    )
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
    rerender(input())
    rerender(input())
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual([0])
  })

  it('pulses once under StrictMode for the same in-tune step', async () => {
    vi.mocked(pulseHaptic).mockClear()
    const { result } = renderHook(() => useStringLock(input()), {
      wrapper: StrictMode,
    })
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('does not pulse or clear the check when the reading goes silent', async () => {
    vi.mocked(pulseHaptic).mockClear()
    const { result, rerender } = renderHook(
      (props: StringLockInput) => useStringLock(props),
      {
        initialProps: input(),
      },
    )
    await waitFor(() => {
      expect(pulseHaptic).toHaveBeenCalledTimes(1)
    })
    rerender(input({ stringIndex: null, inTune: false }))
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('clears checks on a new tuning key without pulsing that step', async () => {
    vi.mocked(pulseHaptic).mockClear()
    const { result, rerender } = renderHook(
      (props: StringLockInput) => useStringLock(props),
      {
        initialProps: input(),
      },
    )
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    rerender(input({ tuningKey: 'custom-draft:41,45,50,55,59,64' }))
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('does not pulse when the screen is chromatic', async () => {
    vi.mocked(pulseHaptic).mockClear()
    const { result } = renderHook(() =>
      useStringLock(input({ screen: 'chromatic', stringIndex: null })),
    )
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
    expect(pulseHaptic).not.toHaveBeenCalled()
  })
})
