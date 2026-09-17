import { describe, expect, it, vi } from 'vitest'

import { MicStreamError, startMicSession } from './micStream'
import {
  FakeAudioContext,
  FakeAudioWorkletNode,
  fakeStream,
  fakeTrack,
} from '../test/fakeAudioContext'

vi.mock('./capture-processor.ts?worker&url', () => ({
  default: '/capture-processor.js',
}))

function stubDevices(getUserMedia: () => Promise<MediaStream>): void {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  })
}

function stubAudio(context: FakeAudioContext): FakeAudioWorkletNode[] {
  const nodes: FakeAudioWorkletNode[] = []
  class BoundAudioContext {
    constructor() {
      return context
    }
  }
  vi.stubGlobal('AudioContext', BoundAudioContext)
  vi.stubGlobal(
    'AudioWorkletNode',
    class extends FakeAudioWorkletNode {
      constructor() {
        super()
        nodes.push(this)
      }
    },
  )
  return nodes
}

describe('startMicSession', () => {
  it('opens a worklet session with processing filters disabled', async () => {
    const stream = fakeStream()
    const getUserMedia = vi.fn(async () => stream)
    stubDevices(getUserMedia)
    const context = new FakeAudioContext()
    const nodes = stubAudio(context)
    const onWindow = vi.fn()
    const session = await startMicSession(onWindow)
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    expect(context.audioWorklet.addModule).toHaveBeenCalledWith('/capture-processor.js')
    const samples = new Float32Array([0.1, 0.2])
    nodes[0]?.port.onmessage?.({ data: samples } as MessageEvent<Float32Array>)
    expect(onWindow).toHaveBeenCalledWith(samples, 48000)
    session.stop()
    expect(stream.getTracks()[0]?.stop).toHaveBeenCalled()
    expect(context.close).toHaveBeenCalled()
  })

  it('maps getUserMedia errors onto tuner reasons', async () => {
    stubDevices(async () => {
      throw new DOMException('denied', 'NotAllowedError')
    })
    await expect(startMicSession(vi.fn())).rejects.toMatchObject({
      reason: 'permission-denied',
    })
    stubDevices(async () => {
      throw new DOMException('blocked', 'SecurityError')
    })
    await expect(startMicSession(vi.fn())).rejects.toMatchObject({
      reason: 'permission-denied',
    })
    stubDevices(async () => {
      throw new DOMException('none', 'NotFoundError')
    })
    await expect(startMicSession(vi.fn())).rejects.toMatchObject({
      reason: 'no-microphone',
    })
    stubDevices(async () => {
      throw new DOMException('range', 'OverconstrainedError')
    })
    await expect(startMicSession(vi.fn())).rejects.toMatchObject({
      reason: 'no-microphone',
    })
    stubDevices(async () => {
      throw new Error('boom')
    })
    await expect(startMicSession(vi.fn())).rejects.toBeInstanceOf(MicStreamError)
  })

  it('refuses to resume when tracks are dead and notifies on ended', async () => {
    const track = fakeTrack()
    const stream = fakeStream([track])
    stubDevices(async () => stream)
    const context = new FakeAudioContext()
    stubAudio(context)
    const onLost = vi.fn()
    const session = await startMicSession(vi.fn(), onLost)
    track.readyState = 'ended'
    await expect(session.resume()).resolves.toBe(false)
    track.readyState = 'live'
    await expect(session.resume()).resolves.toBe(true)
    track.emit('ended')
    expect(onLost).toHaveBeenCalledTimes(1)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    track.emit('ended')
    expect(onLost).toHaveBeenCalledTimes(1)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    session.stop()
  })

  it('treats a visible suspended context as a lost stream', async () => {
    const stream = fakeStream()
    stubDevices(async () => stream)
    const context = new FakeAudioContext()
    stubAudio(context)
    const onLost = vi.fn()
    const session = await startMicSession(vi.fn(), onLost)
    context.resume.mockImplementation(async () => {
      context.state = 'suspended'
    })
    context.emitState('suspended')
    await vi.waitFor(() => {
      expect(onLost).toHaveBeenCalled()
    })
    session.stop()
  })

  it('does not treat a background suspend as a lost stream', async () => {
    const stream = fakeStream()
    stubDevices(async () => stream)
    const context = new FakeAudioContext()
    stubAudio(context)
    const onLost = vi.fn()
    const session = await startMicSession(vi.fn(), onLost)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    context.emitState('suspended')
    await Promise.resolve()
    expect(onLost).not.toHaveBeenCalled()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    session.stop()
  })
})
