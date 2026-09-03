import { afterEach, describe, expect, it, vi } from 'vitest'

import { resumeAudioContext, type ResumableContext } from './audioContextResume'

interface StubContext extends ResumableContext {
  state: AudioContextState
  calls: number
}

function stubContext(
  state: AudioContextState,
  onResume: (context: StubContext) => Promise<void>,
): StubContext {
  const context: StubContext = {
    state,
    calls: 0,
    resume: () => {
      context.calls += 1
      return onResume(context)
    },
  }
  return context
}

const never = (): Promise<void> => new Promise<void>(() => undefined)

afterEach(() => {
  vi.useRealTimers()
})

describe('resumeAudioContext', () => {
  it('skips resume when the context already runs', async () => {
    const context = stubContext('running', never)

    await expect(resumeAudioContext(context)).resolves.toBe(true)
    expect(context.calls).toBe(0)
  })

  it('reports failure for a closed context', async () => {
    const context = stubContext('closed', never)

    await expect(resumeAudioContext(context)).resolves.toBe(false)
    expect(context.calls).toBe(0)
  })

  it('resumes a suspended context', async () => {
    const context = stubContext('suspended', (ctx) => {
      ctx.state = 'running'
      return Promise.resolve()
    })

    await expect(resumeAudioContext(context)).resolves.toBe(true)
    expect(context.calls).toBe(1)
  })

  it('reports failure when resume settles but the context stays suspended', async () => {
    const context = stubContext('suspended', () => Promise.resolve())

    await expect(resumeAudioContext(context)).resolves.toBe(false)
  })

  it('reports failure when resume rejects', async () => {
    const context = stubContext('suspended', () => Promise.reject(new Error('nope')))

    await expect(resumeAudioContext(context)).resolves.toBe(false)
  })

  it('gives up instead of hanging when resume never settles', async () => {
    vi.useFakeTimers()
    const context = stubContext('suspended', never)

    const resumed = resumeAudioContext(context, 100)
    await vi.advanceTimersByTimeAsync(100)

    await expect(resumed).resolves.toBe(false)
  })
})
