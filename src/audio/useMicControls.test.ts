import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MicStreamError } from './micStream'
import { useMicControls } from './useMicControls'
import type { PitchState, PitchStatus } from './pitchState'
import type { MicSession } from './micStream'
import { STALE_BACKGROUND_MS } from './audioContextResume'
import { installAppResumeHandlers } from './appResume'

const { startMicSession } = vi.hoisted(() => ({
  startMicSession: vi.fn(),
}))

vi.mock('./micStream', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./micStream')>()
  return { ...actual, startMicSession }
})

function fakeSession(): MicSession {
  return {
    sampleRate: 48000,
    resume: vi.fn(async () => true),
    stop: vi.fn(),
  }
}

describe('useMicControls', () => {
  beforeEach(() => {
    startMicSession.mockReset()
    startMicSession.mockResolvedValue(fakeSession())
  })

  it('starts listening and stops back to idle', async () => {
    const session = fakeSession()
    startMicSession.mockResolvedValue(session)
    const states: PitchState[] = []
    const { result, unmount } = renderHook(() =>
      useMicControls((update) => {
        const prev: PitchState = {
          status: 'idle',
          error: null,
          frequency: null,
          clarity: null,
        }
        states.push(typeof update === 'function' ? update(prev) : update)
      }, 'idle'),
    )
    await waitFor(() => {
      expect(states.some((state) => state.status === 'listening')).toBe(true)
    })
    result.current.stop()
    expect(session.stop).toHaveBeenCalled()
    expect(states[states.length - 1]?.status).toBe('idle')
    unmount()
  })

  it('surfaces a mic error from startMicSession', async () => {
    startMicSession.mockRejectedValue(new MicStreamError('permission-denied'))
    const states: PitchState[] = []
    renderHook(() =>
      useMicControls((update) => {
        const prev: PitchState = {
          status: 'idle',
          error: null,
          frequency: null,
          clarity: null,
        }
        states.push(typeof update === 'function' ? update(prev) : update)
      }, 'idle'),
    )
    await waitFor(() => {
      expect(states.some((state) => state.error === 'permission-denied')).toBe(true)
    })
  })

  it('EC-stale-30s restarts after a long background while listening', async () => {
    let now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    startMicSession.mockResolvedValue(fakeSession())
    installAppResumeHandlers()
    const { result } = renderHook(() => useMicControls(vi.fn(), 'idle'))
    result.current.start()
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalled()
    })
    startMicSession.mockClear()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    now += STALE_BACKGROUND_MS + 50
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalled()
    })
  })

  it('does not resume a session the user stopped', async () => {
    installAppResumeHandlers()
    startMicSession.mockResolvedValue(fakeSession())
    const { result } = renderHook(() => useMicControls(vi.fn(), 'idle'))
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalled()
    })
    result.current.stop()
    startMicSession.mockClear()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()
    expect(startMicSession).not.toHaveBeenCalled()
  })

  it('EC-autostart-idle starts once from idle when the user has not stopped', async () => {
    startMicSession.mockResolvedValue(fakeSession())
    renderHook(() => useMicControls(vi.fn(), 'idle'))
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(1)
    })
  })

  it('EC-autostart-stopped does not start again after Stop', async () => {
    startMicSession.mockResolvedValue(fakeSession())
    const setState = vi.fn()
    const { result, rerender } = renderHook(
      ({ status }: { status: PitchStatus }) => useMicControls(setState, status),
      { initialProps: { status: 'idle' as PitchStatus } },
    )
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(1)
    })
    rerender({ status: 'listening' })
    result.current.stop()
    startMicSession.mockClear()
    rerender({ status: 'idle' })
    await Promise.resolve()
    expect(startMicSession).not.toHaveBeenCalled()
  })

  it('EC-autostart-busy does not start again while starting or listening', async () => {
    for (const status of ['starting', 'listening'] as const) {
      startMicSession.mockClear()
      const { result } = renderHook(() => useMicControls(vi.fn(), status))
      result.current.start()
      await Promise.resolve()
      expect(startMicSession).not.toHaveBeenCalled()
    }
  })

  it('EC-autostart-denied does not start again from an error', async () => {
    startMicSession.mockRejectedValue(new MicStreamError('permission-denied'))
    const setState = vi.fn()
    const { rerender } = renderHook(
      ({ status }: { status: PitchStatus }) => useMicControls(setState, status),
      { initialProps: { status: 'idle' as PitchStatus } },
    )
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(1)
    })
    rerender({ status: 'error' })
    await Promise.resolve()
    expect(startMicSession).toHaveBeenCalledTimes(1)
  })

  it('restarts when a short background resume fails', async () => {
    let now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const session = fakeSession()
    session.resume = vi.fn(async () => false)
    startMicSession.mockResolvedValue(session)
    installAppResumeHandlers()
    const { result } = renderHook(() => useMicControls(vi.fn(), 'idle'))
    result.current.start()
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalled()
    })
    startMicSession.mockClear()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    now += 1_000
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalled()
    })
  })

  it('restarts when the live stream is lost', async () => {
    let onLost: (() => void) | undefined
    startMicSession.mockImplementation(async (_onWindow, lost?: () => void) => {
      onLost = lost
      return fakeSession()
    })
    const { result } = renderHook(() => useMicControls(vi.fn(), 'idle'))
    result.current.start()
    await waitFor(() => {
      expect(onLost).toBeDefined()
    })
    startMicSession.mockClear()
    vi.useFakeTimers()
    onLost?.()
    await vi.runAllTimersAsync()
    expect(startMicSession).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
