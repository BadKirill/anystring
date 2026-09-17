import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MicStreamError } from './micStream'
import { useMicControls } from './useMicControls'
import type { PitchState } from './pitchState'
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
      }),
    )
    result.current.start()
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
    const { result } = renderHook(() =>
      useMicControls((update) => {
        const prev: PitchState = {
          status: 'idle',
          error: null,
          frequency: null,
          clarity: null,
        }
        states.push(typeof update === 'function' ? update(prev) : update)
      }),
    )
    result.current.start()
    await waitFor(() => {
      expect(states.some((state) => state.error === 'permission-denied')).toBe(true)
    })
  })

  it('restarts after a long background while listening', async () => {
    let now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    startMicSession.mockResolvedValue(fakeSession())
    installAppResumeHandlers()
    const { result } = renderHook(() => useMicControls(vi.fn()))
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

  it('does nothing on resume when the mic is idle', async () => {
    installAppResumeHandlers()
    startMicSession.mockClear()
    renderHook(() => useMicControls(vi.fn()))
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

  it('restarts when a short background resume fails', async () => {
    let now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const session = fakeSession()
    session.resume = vi.fn(async () => false)
    startMicSession.mockResolvedValue(session)
    installAppResumeHandlers()
    const { result } = renderHook(() => useMicControls(vi.fn()))
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
    const { result } = renderHook(() => useMicControls(vi.fn()))
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
