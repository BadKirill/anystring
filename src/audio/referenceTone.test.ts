import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { pitchToFrequency } from '../core/music'
import { PLUCK_VOICES } from '../core/signal/pluckVoice'
import {
  FakeAudioContext,
  FakeBiquadFilter,
  FakeBufferSource,
  FakeGain,
} from '../test/fakeAudioContext'
import { installAppResumeHandlers } from './appResume'
import { STALE_BACKGROUND_MS } from './audioContextResume'
import {
  playReferencePitch,
  REFERENCE_SWITCH_FADE_S,
  resetReferenceAudio,
} from './referenceTone'

function lastValue(results: { value: unknown }[] | undefined): unknown {
  const value = results?.[results.length - 1]?.value
  if (value === undefined) {
    throw new Error('missing audio node')
  }
  return value
}

async function playBassAndUkulele(ctx: FakeAudioContext | undefined): Promise<void> {
  await playReferencePitch({ note: 'A', octave: 3 }, 'ukulele')
  await playReferencePitch({ note: 'A', octave: 3 }, 'bass')
  const calls = ctx?.createBuffer.mock.calls ?? []
  const ukuleleLength = calls[1]?.[1] ?? 0
  const bassLength = calls[2]?.[1] ?? 0
  expect(bassLength).toBeGreaterThan(ukuleleLength)
}

describe('referenceTone', () => {
  const contexts: FakeAudioContext[] = []

  beforeEach(() => {
    resetReferenceAudio()
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

  it('EC-highpass-bass plays a plucked buffer through a guitar-like filter chain', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    await playReferencePitch({ note: 'E', octave: 2 })
    const ctx = contexts[0]
    expect(ctx).toBeDefined()
    expect(ctx?.createBufferSource).toHaveBeenCalled()
    const source = ctx?.createBufferSource.mock.results[0]?.value as FakeBufferSource
    expect(source.started).toBe(true)
    expect(source.buffer).not.toBeNull()
    expect(ctx?.createBiquadFilter).toHaveBeenCalled()
    const highpass = ctx?.createBiquadFilter.mock.results[0]?.value as FakeBiquadFilter
    expect(highpass.type).toBe('highpass')
    expect(highpass.frequency.value).toBeLessThan(
      pitchToFrequency({ note: 'B', octave: 0 }),
    )
    await playReferencePitch({ note: 'E', octave: 2 })
    expect(ctx?.createBuffer).toHaveBeenCalledTimes(1)
    await playBassAndUkulele(ctx)
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

  it('EC-note-switch fades the previous note out instead of cutting it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await playReferencePitch({ note: 'E', octave: 2 })
    const ctx = contexts[contexts.length - 1]
    expect(ctx).toBeDefined()
    if (!ctx) {
      return
    }
    const heldGain = lastValue(ctx.createGain.mock.results) as FakeGain
    const heldSource = lastValue(ctx.createBufferSource.mock.results) as FakeBufferSource
    ctx.currentTime = 0.4
    await playReferencePitch({ note: 'A', octave: 3 })
    const fadeEnd = 0.4 + REFERENCE_SWITCH_FADE_S
    expect(heldGain.gain.cancelScheduledValues).toHaveBeenCalledWith(0.4)
    expect(heldGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, fadeEnd)
    expect(heldSource.stop).toHaveBeenCalledWith(fadeEnd)
    expect(heldSource.disconnect).not.toHaveBeenCalled()
    const nextGain = lastValue(ctx.createGain.mock.results) as FakeGain
    const nextSource = lastValue(ctx.createBufferSource.mock.results) as FakeBufferSource
    expect(nextGain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0.4)
    expect(nextGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.88, fadeEnd)
    const releaseMs = REFERENCE_SWITCH_FADE_S * 1000 + 40
    await vi.advanceTimersByTimeAsync(releaseMs)
    expect(heldSource.disconnect).toHaveBeenCalled()
    const tailMs = PLUCK_VOICES.guitar.durationS * 1000 + 80 - releaseMs
    await vi.advanceTimersByTimeAsync(tailMs)
    expect(nextSource.disconnect).toHaveBeenCalled()
  })

  it('EC-note-switch-fast keeps the in-progress fade level', async () => {
    await playReferencePitch({ note: 'E', octave: 2 })
    const ctx = contexts[contexts.length - 1]
    expect(ctx).toBeDefined()
    if (!ctx) {
      return
    }
    ctx.currentTime = 0.5
    await playReferencePitch({ note: 'A', octave: 3 })
    const fading = lastValue(ctx.createGain.mock.results) as FakeGain
    const switchAt = 0.5 + REFERENCE_SWITCH_FADE_S / 5
    ctx.currentTime = switchAt
    await playReferencePitch({ note: 'D', octave: 4 })
    const full = fading.gain.linearRampToValueAtTime.mock.calls[0]?.[0]
    expect(full).toBe(0.88)
    const calls = fading.gain.setValueAtTime.mock.calls
    const released = calls[calls.length - 1]
    expect(released?.[0]).toBeCloseTo(0.88 / 5)
    expect(released?.[1]).toBe(switchAt)
  })

  it('EC-note-switch-ended still plays the next note if the previous source already stopped', async () => {
    await playReferencePitch({ note: 'E', octave: 2 })
    const ctx = contexts[contexts.length - 1]
    expect(ctx).toBeDefined()
    if (!ctx) {
      return
    }
    const heldSource = lastValue(ctx.createBufferSource.mock.results) as FakeBufferSource
    heldSource.stop.mockImplementation(() => {
      throw new DOMException('already stopped', 'InvalidStateError')
    })
    ctx.currentTime = 0.2
    await playReferencePitch({ note: 'A', octave: 4 })
    const next = lastValue(ctx.createBufferSource.mock.results) as FakeBufferSource
    expect(heldSource.stop).toHaveBeenCalled()
    expect(next.started).toBe(true)
    next.stop.mockImplementation(() => {
      throw new Error('broken')
    })
    ctx.currentTime = 0.5
    await expect(playReferencePitch({ note: 'D', octave: 3 })).rejects.toThrow('broken')
  })
})
