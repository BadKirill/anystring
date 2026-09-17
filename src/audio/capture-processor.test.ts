interface CaptureProcessor {
  process: (
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    params: Record<string, Float32Array>,
  ) => boolean
}

const harness = vi.hoisted(() => {
  const postMessage = vi.fn()
  class AudioWorkletProcessor {
    port = { postMessage }
  }
  const registered = new Map<string, new () => CaptureProcessor>()
  vi.stubGlobal('AudioWorkletProcessor', AudioWorkletProcessor)
  vi.stubGlobal('registerProcessor', (name: string, ctor: new () => CaptureProcessor) => {
    registered.set(name, ctor)
  })
  return { postMessage, registered }
})

import { describe, expect, it, vi } from 'vitest'

import './capture-processor'

const WINDOW_SIZE = 8192
const POST_INTERVAL = 4096

describe('capture-processor', () => {
  it('registers an 8192-sample capture processor that posts overlapping windows', () => {
    const Ctor = harness.registered.get('capture-processor')
    if (!Ctor) {
      throw new Error('capture-processor was not registered')
    }
    const processor = new Ctor()
    const silent = processor.process([[]], [], {})
    expect(silent).toBe(true)
    expect(harness.postMessage).not.toHaveBeenCalled()

    const first = new Float32Array(POST_INTERVAL)
    first[0] = 0.5
    processor.process([[first]], [], {})
    expect(harness.postMessage).not.toHaveBeenCalled()

    const second = new Float32Array(POST_INTERVAL)
    second[1] = 0.25
    processor.process([[second]], [], {})
    expect(harness.postMessage).toHaveBeenCalledTimes(1)
    const window = harness.postMessage.mock.calls[0]?.[0] as Float32Array
    expect(window).toHaveLength(WINDOW_SIZE)
    expect(window[0]).toBe(0.5)
    expect(window[POST_INTERVAL + 1]).toBe(0.25)

    const third = new Float32Array(POST_INTERVAL)
    processor.process([[third]], [], {})
    expect(harness.postMessage).toHaveBeenCalledTimes(2)
  })
})
