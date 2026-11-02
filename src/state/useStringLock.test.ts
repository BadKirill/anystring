import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

const NEXT = 'custom-draft:41,45,50,55,59,64'

describe('useStringLock', () => {
  beforeEach(() => {
    vi.mocked(pulseHaptic).mockClear()
  })

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
    expect(pulseHaptic).toHaveBeenCalledWith()
    rerender(input())
    rerender(input())
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual([0])
  })

  it('pulses once under StrictMode for the same in-tune step', async () => {
    const { result } = renderHook(() => useStringLock(input()), {
      wrapper: StrictMode,
    })
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('does not pulse or clear the check when the reading goes silent', async () => {
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
    const { result, rerender } = renderHook(
      (props: StringLockInput) => useStringLock(props),
      {
        initialProps: input(),
      },
    )
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    rerender(input({ tuningKey: NEXT }))
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('does not pulse when the screen is chromatic', async () => {
    const { result } = renderHook(() =>
      useStringLock(input({ screen: 'chromatic', stringIndex: null })),
    )
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
    expect(pulseHaptic).not.toHaveBeenCalled()
  })

  it('pulses again on re-arm and does not duplicate the check', async () => {
    const { result, rerender } = renderHook(
      (props: StringLockInput) => useStringLock(props),
      {
        initialProps: input(),
      },
    )
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    rerender(input({ inTune: false }))
    await act(async () => undefined)
    expect(result.current).toEqual([0])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)

    rerender(input({ inTune: true }))
    await waitFor(() => {
      expect(pulseHaptic).toHaveBeenCalledTimes(2)
    })
    expect(result.current).toEqual([0])
  })

  it('checks the next in-tune string and keeps the first', async () => {
    const { result, rerender } = renderHook(
      (props: StringLockInput) => useStringLock(props),
      {
        initialProps: input(),
      },
    )
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    rerender(input({ stringIndex: 2 }))
    await waitFor(() => {
      expect(result.current).toEqual([0, 2])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(2)
  })

  it('locks the new tuning only on a later reading', async () => {
    const { result, rerender } = renderHook(
      (props: StringLockInput) => useStringLock(props),
      {
        initialProps: input(),
      },
    )
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    rerender(input({ tuningKey: NEXT }))
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(1)

    rerender(input({ tuningKey: NEXT, inTune: false }))
    await act(async () => undefined)
    expect(result.current).toEqual([])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)

    rerender(input({ tuningKey: NEXT }))
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(2)
  })

  it('does not lock the new key when StrictMode replays the clear', async () => {
    const { result, rerender } = renderHook(
      (props: StringLockInput) => useStringLock(props),
      {
        initialProps: input(),
        wrapper: StrictMode,
      },
    )
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
    rerender(input({ tuningKey: NEXT }))
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
    await act(async () => undefined)
    expect(result.current).toEqual([])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('keeps the check and stays quiet after switching to chromatic', async () => {
    const { result, rerender } = renderHook(
      (props: StringLockInput) => useStringLock(props),
      {
        initialProps: input(),
      },
    )
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    rerender(input({ screen: 'chromatic', stringIndex: null, inTune: false }))
    await act(async () => undefined)
    expect(result.current).toEqual([0])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)
  })

  it('EC-lock-return pulses once when strings come back in tune', async () => {
    const { result, rerender } = renderHook(
      (props: StringLockInput) => useStringLock(props),
      {
        initialProps: input(),
      },
    )
    await waitFor(() => {
      expect(result.current).toEqual([0])
    })
    rerender(input({ screen: 'chromatic', stringIndex: null, inTune: false }))
    await act(async () => undefined)
    expect(result.current).toEqual([0])
    expect(pulseHaptic).toHaveBeenCalledTimes(1)

    rerender(input())
    await waitFor(() => {
      expect(pulseHaptic).toHaveBeenCalledTimes(2)
    })
    expect(result.current).toEqual([0])
  })

  it('stays empty and silent when the first reading is not in tune', async () => {
    const { result } = renderHook(() =>
      useStringLock(input({ stringIndex: null, inTune: false })),
    )
    await act(async () => undefined)
    expect(result.current).toEqual([])
    expect(pulseHaptic).not.toHaveBeenCalled()
  })
})
