import workletUrl from './capture-processor.ts?worker&url'
import { resumeAudioContext } from './audioContextResume'

export type MicError = 'permission-denied' | 'no-microphone' | 'unavailable'

export class MicStreamError extends Error {
  readonly reason: MicError

  constructor(reason: MicError) {
    super(`Microphone unavailable: ${reason}`)
    this.name = 'MicStreamError'
    this.reason = reason
  }
}

export interface MicSession {
  readonly sampleRate: number

  resume(): Promise<boolean>
  stop(): void
}

function toMicError(error: unknown): MicStreamError {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return new MicStreamError('permission-denied')
    }
    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
      return new MicStreamError('no-microphone')
    }
  }
  return new MicStreamError('unavailable')
}

function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

/** A muted or ended track keeps delivering silence — the graph must be rebuilt. */
function tracksAreLive(stream: MediaStream): boolean {
  const tracks = stream.getAudioTracks()
  return (
    tracks.length > 0 &&
    tracks.every((track) => track.readyState === 'live' && !track.muted)
  )
}

function watchContextSuspend(context: AudioContext, onDead: () => void): () => void {
  const onState = (): void => {
    if (context.state !== 'suspended' || isDocumentHidden()) {
      return
    }
    void resumeAudioContext(context).then((ok) => {
      if (!ok && !isDocumentHidden()) {
        onDead()
      }
    })
  }
  context.addEventListener('statechange', onState)
  return () => {
    context.removeEventListener('statechange', onState)
  }
}

async function openMicStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
  } catch (error) {
    throw toMicError(error)
  }
}

async function resumeSession(
  stream: MediaStream,
  context: AudioContext,
): Promise<boolean> {
  if (!tracksAreLive(stream)) {
    return false
  }
  return resumeAudioContext(context)
}

function attachLostHandlers(
  stream: MediaStream,
  context: AudioContext,
  onStreamLost?: () => void,
): () => void {
  const notifyLost = (): void => {
    if (!isDocumentHidden()) {
      onStreamLost?.()
    }
  }
  for (const track of stream.getAudioTracks()) {
    track.addEventListener('ended', notifyLost)
  }
  const unwatch = watchContextSuspend(context, notifyLost)
  return () => {
    unwatch()
    for (const track of stream.getAudioTracks()) {
      track.removeEventListener('ended', notifyLost)
    }
  }
}

export async function startMicSession(
  onWindow: (samples: Float32Array, sampleRate: number) => void,
  onStreamLost?: () => void,
): Promise<MicSession> {
  const stream = await openMicStream()
  const context = new AudioContext()
  await resumeAudioContext(context)
  await context.audioWorklet.addModule(workletUrl)

  const source = context.createMediaStreamSource(stream)
  const worklet = new AudioWorkletNode(context, 'capture-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 0,
  })
  worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
    onWindow(event.data, context.sampleRate)
  }
  source.connect(worklet)
  const detachLost = attachLostHandlers(stream, context, onStreamLost)

  return {
    sampleRate: context.sampleRate,
    resume: () => resumeSession(stream, context),
    stop: () => {
      detachLost()
      worklet.port.onmessage = null
      source.disconnect()
      for (const track of stream.getTracks()) {
        track.stop()
      }
      void context.close()
    },
  }
}
