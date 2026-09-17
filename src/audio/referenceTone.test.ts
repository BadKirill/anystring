import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { installAppResumeHandlers } from './appResume'
import { STALE_BACKGROUND_MS } from './audioContextResume'
import { playReferencePitch } from './referenceTone'
import { FakeAudioContext, FakeBufferSource } from '../test/fakeAudioContext'

describe('referenceTone', () => {
  const contexts: FakeAudioContext[] = []

  beforeEach(() => {
    contexts.length = 0
    class BoundAudioContext {
      constructor() {
        const context = new FakeAudioContext()
        contexts.push(context)
        return context
      }
    }
    vi.stubGlobal('AudioContext', BoundAudioContext)
    installAppResumeHandlers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('plays a plucked buffer through a guitar-like filter chain', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    await playReferencePitch({ note: 'E', octave: 2 })
    const ctx = contexts[0]
    expect(ctx).toBeDefined()
    expect(ctx?.createBufferSource).toHaveBeenCalled()
    const source = ctx?.createBufferSource.mock.results[0]?.value as FakeBufferSource
    expect(source.started).toBe(true)
    expect(source.buffer).not.toBeNull()
    expect(ctx?.createBiquadFilter).toHaveBeenCalled()
    await playReferencePitch({ note: 'E', octave: 2 })
    expect(ctx?.createBuffer).toHaveBeenCalledTimes(1)
  })

  it('rebuilds the context after a long background', async () => {
    let now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    await playReferencePitch({ note: 'E', octave: 2 })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    now += STALE_BACKGROUND_MS + 10
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()
    await playReferencePitch({ note: 'A', octave: 4 })
    expect(contexts.length).toBeGreaterThan(0)
  })

  it('rebuilds a closed or unresumable context and warms after a short background', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    let now = 8_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    now += STALE_BACKGROUND_MS + 10
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()
    await playReferencePitch({ note: 'E', octave: 2 })
    const first = contexts[contexts.length - 1]
    expect(first).toBeDefined()
    if (first) {
      first.state = 'closed'
    }
    await playReferencePitch({ note: 'A', octave: 4 })
    expect(contexts.length).toBeGreaterThan(1)
    const live = contexts[contexts.length - 1]
    expect(live).toBeDefined()
    if (live) {
      live.state = 'suspended'
      live.resume.mockImplementation(async () => {
        live.state = 'suspended'
      })
    }
    const { warmReferenceAudio } = await import('./referenceTone')
    await warmReferenceAudio()
    expect(contexts.length).toBeGreaterThan(2)
    now += 500
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
    await Promise.resolve()
  })
})
