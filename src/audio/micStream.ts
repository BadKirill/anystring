/**
 * Microphone capture pipeline: getUserMedia -> AudioWorklet ring buffer.
 *
 * The three DSP constraints are deliberately disabled: echo cancellation,
 * noise suppression and AGC all filter or distort the low-frequency content
 * a bass tuner depends on. Never re-enable them.
 */
import workletUrl from './capture-processor.ts?worker&url'

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
  /** Soft-resume after iOS suspends the context; false if the graph is dead. */
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

function contextIsRunning(context: AudioContext): boolean {
  return context.state === 'running'
}

/**
 * iOS suspends AudioContext whenever the app backgrounds. That is normal —
 * only treat a suspend as fatal while the UI is visible and resume fails.
 */
function watchContextSuspend(context: AudioContext, onDead: () => void): () => void {
  const onState = (): void => {
    if (context.state !== 'suspended' || isDocumentHidden()) {
      return
    }
    void context
      .resume()
      .then(() => {
        if (!contextIsRunning(context) && !isDocumentHidden()) {
          onDead()
        }
      })
      .catch(() => {
        if (!isDocumentHidden()) {
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

async function resumeContext(context: AudioContext): Promise<boolean> {
  if (context.state === 'closed') {
    return false
  }
  if (contextIsRunning(context)) {
    return true
  }
  try {
    await context.resume()
  } catch {
    return false
  }
  return contextIsRunning(context)
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

/**
 * Requests the microphone and streams 8192-sample windows to onWindow.
 * Must be called from a user gesture handler (mobile autoplay policy).
 */
export async function startMicSession(
  onWindow: (samples: Float32Array, sampleRate: number) => void,
  onStreamLost?: () => void,
): Promise<MicSession> {
  const stream = await openMicStream()
  const context = new AudioContext()
  await context.resume()
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
    resume: () => resumeContext(context),
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
