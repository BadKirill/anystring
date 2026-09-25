import type { Dispatch, SetStateAction } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { MicStreamError, type MicSession } from './micStream'
import {
  beginMicSession,
  resumeMicSession,
  stopMicSession,
  type SessionRefs,
} from './micSessionControl'
import type { PitchState } from './pitchState'

const { startMicSession, setAudioSessionMode } = vi.hoisted(() => ({
  startMicSession: vi.fn(),
  setAudioSessionMode: vi.fn(),
}))

vi.mock('./micStream', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./micStream')>()
  return { ...actual, startMicSession }
})

vi.mock('../platform/audioSession', () => ({
  setAudioSessionMode,
}))

function refs(overrides: Partial<SessionRefs> = {}): SessionRefs {
  return {
    active: { current: true },
    session: { current: null },
    recent: { current: [440] },
    generation: { current: 0 },
    ...overrides,
  }
}

function fakeSession(resume = true): MicSession {
  return {
    sampleRate: 48000,
    resume: vi.fn(async () => resume),
    stop: vi.fn(),
  }
}

describe('micSessionControl', () => {
  it('does not start when the session is no longer active', () => {
    beginMicSession(refs({ active: { current: false } }), vi.fn(), vi.fn(), vi.fn())
    expect(startMicSession).not.toHaveBeenCalled()
  })

  it('EC-stale-start marks listening after the mic opens and stops a stale generation', async () => {
    const live = fakeSession()
    const stale = fakeSession()
    startMicSession.mockResolvedValueOnce(stale).mockResolvedValueOnce(live)
    const states: PitchState[] = []
    const setState: Dispatch<SetStateAction<PitchState>> = (update) => {
      if (typeof update !== 'function') {
        states.push(update)
      }
    }
    const first = refs()
    beginMicSession(first, setState, vi.fn(), vi.fn())
    beginMicSession(first, setState, vi.fn(), vi.fn())
    await vi.waitFor(() => {
      expect(stale.stop).toHaveBeenCalled()
      expect(first.session.current).toBe(live)
    })
    expect(states[states.length - 1]?.status).toBe('listening')
    expect(setAudioSessionMode).toHaveBeenCalledWith('capture')
  })

  it('records a permission error and ignores a stale rejection', async () => {
    startMicSession.mockRejectedValueOnce(new MicStreamError('permission-denied'))
    const setState = vi.fn()
    const handle = refs()
    beginMicSession(handle, setState, vi.fn(), vi.fn())
    await vi.waitFor(() => {
      expect(handle.active.current).toBe(false)
    })
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', error: 'permission-denied' }),
    )
    startMicSession.mockRejectedValueOnce(new Error('gone'))
    const stale = refs()
    beginMicSession(stale, setState, vi.fn(), vi.fn())
    stale.generation.current += 1
    await Promise.resolve()
    await Promise.resolve()
    expect(stale.active.current).toBe(true)
  })

  it('restarts when the stream is lost while visible', async () => {
    let onLost: (() => void) | undefined
    startMicSession.mockImplementation(async (_onWindow, lost?: () => void) => {
      onLost = lost
      return fakeSession()
    })
    const restart = vi.fn()
    vi.useFakeTimers()
    beginMicSession(refs(), vi.fn(), vi.fn(), restart)
    await vi.waitFor(() => {
      expect(onLost).toBeDefined()
    })
    onLost?.()
    await vi.runAllTimersAsync()
    expect(restart).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('does not restart when the stream is lost in the background', async () => {
    let onLost: (() => void) | undefined
    startMicSession.mockImplementation(async (_onWindow, lost?: () => void) => {
      onLost = lost
      return fakeSession()
    })
    const restart = vi.fn()
    beginMicSession(refs(), vi.fn(), vi.fn(), restart)
    await vi.waitFor(() => {
      expect(onLost).toBeDefined()
    })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    onLost?.()
    expect(restart).not.toHaveBeenCalled()
  })

  it('resumes the live session and stops back to idle', async () => {
    const session = fakeSession()
    const handle = refs({ session: { current: session } })
    await expect(resumeMicSession(handle)).resolves.toBe(true)
    expect(setAudioSessionMode).toHaveBeenCalledWith('capture')
    const idle = refs({ session: { current: session } })
    idle.active.current = false
    await expect(resumeMicSession(idle)).resolves.toBe(false)
    const failed = fakeSession(false)
    const dead = refs({ session: { current: failed } })
    await expect(resumeMicSession(dead)).resolves.toBe(false)
    const setState = vi.fn()
    stopMicSession(handle, setState)
    expect(session.stop).toHaveBeenCalled()
    expect(handle.session.current).toBeNull()
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'idle', frequency: null }),
    )
    expect(setAudioSessionMode).toHaveBeenCalledWith('playback')
  })
})
