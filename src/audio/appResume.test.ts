import { beforeEach, describe, expect, it, vi } from 'vitest'

import { installAppResumeHandlers, onAppResume, type AppResumeInfo } from './appResume'

describe('appResume', () => {
  beforeEach(() => {
    installAppResumeHandlers()
  })

  it('notifies subscribers with the hidden duration on visibility return', async () => {
    let now = 1_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const seen: AppResumeInfo[] = []
    const stop = onAppResume((info) => {
      seen.push(info)
    })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    now = 4_000
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.waitFor(() => {
      expect(seen).toEqual([{ hiddenMs: 3000 }])
    })
    stop()
    document.dispatchEvent(new Event('visibilitychange'))
    expect(seen).toHaveLength(1)
  })

  it('treats a persisted pageshow as an unknown background duration', async () => {
    const seen: AppResumeInfo[] = []
    const stop = onAppResume((info) => {
      seen.push(info)
    })
    window.dispatchEvent(new Event('pagehide'))
    const event = new Event('pageshow') as PageTransitionEvent
    Object.defineProperty(event, 'persisted', { value: true })
    window.dispatchEvent(event)
    await vi.waitFor(() => {
      expect(seen[0]?.hiddenMs).toBe(Number.POSITIVE_INFINITY)
    })
    stop()
  })

  it('ignores an overlapping resume while handlers are still running', async () => {
    let release: () => void = () => undefined
    const first = new Promise<void>((resolve) => {
      release = resolve
    })
    const calls: number[] = []
    const stop = onAppResume(async () => {
      calls.push(1)
      await first
    })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()
    expect(calls).toEqual([1])
    document.dispatchEvent(new Event('visibilitychange'))
    expect(calls).toEqual([1])
    release()
    await first
    stop()
  })
})
