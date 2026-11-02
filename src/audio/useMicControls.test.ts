import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

  afterEach(() => {
    vi.useRealTimers()
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
    const [onWindow, onLost] = startMicSession.mock.calls[0] ?? []
    expect(typeof onWindow).toBe('function')
    expect(typeof onLost).toBe('function')
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

  it('EC-autostart-denied does not start again from an error until Start is pressed', async () => {
    startMicSession.mockRejectedValue(new MicStreamError('permission-denied'))
    const setState = vi.fn()
    const { result, rerender } = renderHook(
      ({ status }: { status: PitchStatus }) => useMicControls(setState, status),
      { initialProps: { status: 'idle' as PitchStatus } },
    )
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(1)
    })
    rerender({ status: 'error' })
    vi.useFakeTimers()
    await vi.advanceTimersByTimeAsync(5_000)
    expect(startMicSession).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
    result.current.start()
    expect(startMicSession).toHaveBeenCalledTimes(2)
  })

  it.each(['no-microphone', 'unavailable'] as const)(
    'does not retry a %s failure on its own',
    async (reason) => {
      startMicSession.mockRejectedValue(new MicStreamError(reason))
      const { rerender } = renderHook(
        ({ status }: { status: PitchStatus }) => useMicControls(vi.fn(), status),
        { initialProps: { status: 'idle' as PitchStatus } },
      )
      await waitFor(() => {
        expect(startMicSession).toHaveBeenCalledTimes(1)
      })
      rerender({ status: 'error' })
      await act(async () => undefined)
      expect(startMicSession).toHaveBeenCalledTimes(1)
    },
  )

  it('EC-autostart-button starts again only when Start is pressed after Stop', async () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: PitchStatus }) => useMicControls(vi.fn(), status),
      { initialProps: { status: 'idle' as PitchStatus } },
    )
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(1)
    })
    rerender({ status: 'listening' })
    result.current.stop()
    startMicSession.mockClear()
    rerender({ status: 'idle' })
    await act(async () => undefined)
    expect(startMicSession).not.toHaveBeenCalled()
    result.current.start()
    expect(startMicSession).toHaveBeenCalledTimes(1)
  })

  it('EC-autostart-fresh starts again on a new mount after Stop', async () => {
    const first = renderHook(() => useMicControls(vi.fn(), 'idle'))
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(1)
    })
    first.result.current.stop()
    first.unmount()
    startMicSession.mockClear()
    renderHook(() => useMicControls(vi.fn(), 'idle'))
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(1)
    })
  })

  it('EC-autostart-strict opens the microphone again when StrictMode replays the effect', async () => {
    renderHook(() => useMicControls(vi.fn(), 'idle'), { wrapper: StrictMode })
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(2)
    })
  })

  it('EC-autostart-return listens again when the session falls idle without Stop', async () => {
    const { rerender } = renderHook(
      ({ status }: { status: PitchStatus }) => useMicControls(vi.fn(), status),
      { initialProps: { status: 'idle' as PitchStatus } },
    )
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(1)
    })
    rerender({ status: 'listening' })
    await act(async () => undefined)
    expect(startMicSession).toHaveBeenCalledTimes(1)
    rerender({ status: 'idle' })
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(2)
    })
  })

  it('EC-autostart-unmount stops the live capture when the tuner leaves', async () => {
    const session = fakeSession()
    startMicSession.mockResolvedValue(session)
    const setState = vi.fn()
    const view = renderHook(() => useMicControls(setState, 'idle'))
    await waitFor(() => {
      expect(setState).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'listening' }),
      )
    })
    view.unmount()
    expect(session.stop).toHaveBeenCalledTimes(1)
  })

  it('does not open the microphone when it mounts already in error', async () => {
    renderHook(() => useMicControls(vi.fn(), 'error'))
    await act(async () => undefined)
    expect(startMicSession).not.toHaveBeenCalled()
  })

  it('opens the microphone once while the session moves from idle to listening', async () => {
    const { rerender } = renderHook(
      ({ status }: { status: PitchStatus }) => useMicControls(vi.fn(), status),
      { initialProps: { status: 'idle' as PitchStatus } },
    )
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalledTimes(1)
    })
    rerender({ status: 'starting' })
    rerender({ status: 'listening' })
    await act(async () => undefined)
    expect(startMicSession).toHaveBeenCalledTimes(1)
  })

  it('EC-resume-short keeps the capture when a short background resume succeeds', async () => {
    let now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const session = fakeSession()
    session.resume = vi.fn(async () => true)
    startMicSession.mockResolvedValue(session)
    const setState = vi.fn()
    installAppResumeHandlers()
    renderHook(() => useMicControls(setState, 'idle'))
    await waitFor(() => {
      expect(setState).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'listening' }),
      )
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
    await act(async () => {
      await Promise.resolve()
    })
    expect(session.resume).toHaveBeenCalledTimes(1)
    expect(startMicSession).not.toHaveBeenCalled()
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

  it('EC-duo-fold-resume resumes the live context when the window resizes', async () => {
    const session = fakeSession()
    session.resume = vi.fn(async () => false)
    startMicSession.mockResolvedValue(session)
    const { result } = renderHook(() => useMicControls(vi.fn(), 'idle'))
    startMicSession.mockClear()
    window.dispatchEvent(new Event('resize'))
    expect(startMicSession).not.toHaveBeenCalled()
    result.current.start()
    await waitFor(() => {
      expect(startMicSession).toHaveBeenCalled()
    })
    startMicSession.mockClear()
    window.dispatchEvent(new Event('resize'))
    await waitFor(() => {
      expect(session.resume).toHaveBeenCalled()
    })
    expect(startMicSession).not.toHaveBeenCalled()
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
