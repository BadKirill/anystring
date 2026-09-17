import { vi } from 'vitest'

export class FakeAudioBuffer {
  readonly length: number
  readonly sampleRate: number
  private readonly channel: Float32Array

  constructor(length: number, sampleRate: number) {
    this.length = length
    this.sampleRate = sampleRate
    this.channel = new Float32Array(length)
  }

  copyToChannel(samples: Float32Array): void {
    this.channel.set(samples.subarray(0, this.length))
  }
}

export class FakeAudioNode {
  readonly connected: FakeAudioNode[] = []
  disconnect = vi.fn(() => {
    this.connected.length = 0
  })

  connect = vi.fn((node: FakeAudioNode) => {
    this.connected.push(node)
    return node
  })
}

export class FakeBiquadFilter extends FakeAudioNode {
  type = 'lowpass'
  frequency = { value: 0 }
  Q = { value: 0 }
  gain = { value: 0 }
}

export class FakeGain extends FakeAudioNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
  }
}

export class FakeBufferSource extends FakeAudioNode {
  buffer: FakeAudioBuffer | null = null
  started = false
  start = vi.fn(() => {
    this.started = true
  })
}

export class FakeMediaStreamSource extends FakeAudioNode {}

export class FakeAudioWorkletNode extends FakeAudioNode {
  port: { onmessage: ((event: MessageEvent<Float32Array>) => void) | null } = {
    onmessage: null,
  }
}

type ContextListener = () => void

export class FakeAudioContext {
  state: AudioContextState = 'running'
  sampleRate = 48000
  currentTime = 0
  destination = new FakeAudioNode()
  private readonly stateListeners = new Set<ContextListener>()
  resume = vi.fn(async () => {
    this.state = 'running'
  })
  close = vi.fn(async () => {
    this.state = 'closed'
  })
  audioWorklet = {
    addModule: vi.fn(async () => undefined),
  }
  createBuffer = vi.fn(
    (_channels: number, length: number, sampleRate: number) =>
      new FakeAudioBuffer(length, sampleRate),
  )
  createBufferSource = vi.fn(() => new FakeBufferSource())
  createGain = vi.fn(() => new FakeGain())
  createBiquadFilter = vi.fn(() => new FakeBiquadFilter())
  createMediaStreamSource = vi.fn(() => new FakeMediaStreamSource())

  addEventListener(type: string, listener: ContextListener): void {
    if (type === 'statechange') {
      this.stateListeners.add(listener)
    }
  }

  removeEventListener(type: string, listener: ContextListener): void {
    if (type === 'statechange') {
      this.stateListeners.delete(listener)
    }
  }

  emitState(state: AudioContextState): void {
    this.state = state
    for (const listener of this.stateListeners) {
      listener()
    }
  }
}

export interface FakeTrack {
  kind: string
  readyState: MediaStreamTrackState
  muted: boolean
  stop: ReturnType<typeof vi.fn>
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) => void
  emit: (type: string) => void
}

export function fakeTrack(options: { ended?: boolean; muted?: boolean } = {}): FakeTrack {
  const listeners = new Map<string, Set<EventListener>>()
  const track: FakeTrack = {
    kind: 'audio',
    readyState: options.ended ? 'ended' : 'live',
    muted: options.muted ?? false,
    stop: vi.fn(),
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      const fn = typeof listener === 'function' ? listener : listener.handleEvent
      const set = listeners.get(type) ?? new Set<EventListener>()
      set.add(fn)
      listeners.set(type, set)
    },
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
      const fn = typeof listener === 'function' ? listener : listener.handleEvent
      listeners.get(type)?.delete(fn)
    },
    emit: (type: string) => {
      listeners.get(type)?.forEach((listener) => {
        listener(new Event(type))
      })
    },
  }
  return track
}

export function fakeStream(tracks: FakeTrack[] = [fakeTrack()]): MediaStream {
  return {
    getAudioTracks: () => tracks,
    getTracks: () => tracks,
  } as unknown as MediaStream
}
