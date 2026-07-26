import { pitchToFrequency, type Pitch } from '../core/music'
import { normalizePluck, synthesizePluck } from '../core/signal/pluckedTone'
import { reassertAudioSession } from '../platform/audioSession'
import { onAppResume } from './appResume'
import { suppressPitchDetection } from './pitchGate'

const NOTE_DURATION_S = 1.4
const SUPPRESS_MS = NOTE_DURATION_S * 1000 + 300
const OUTPUT_GAIN = 0.88

let context: AudioContext | null = null
let stopTimer: ReturnType<typeof setTimeout> | null = null
let nodes: AudioNode[] = []
const bufferCache = new Map<number, AudioBuffer>()

function getContext(): AudioContext {
  if (context?.state === 'closed') {
    context = null
    bufferCache.clear()
  }
  context ??= new AudioContext()
  return context
}

function clearPlayback(): void {
  if (stopTimer) {
    clearTimeout(stopTimer)
    stopTimer = null
  }
  for (const node of nodes) {
    node.disconnect()
  }
  nodes = []
}

function track(...added: AudioNode[]): void {
  nodes.push(...added)
}

function pluckBuffer(ctx: AudioContext, frequency: number): AudioBuffer {
  const cached = bufferCache.get(frequency)
  if (cached) {
    return cached
  }
  const samples = normalizePluck(
    synthesizePluck(frequency, ctx.sampleRate, NOTE_DURATION_S),
    0.92,
  )
  const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate)
  buffer.copyToChannel(samples, 0)
  bufferCache.set(frequency, buffer)
  return buffer
}

function guitarChain(ctx: AudioContext, source: AudioNode, frequency: number): AudioNode {
  const highPass = ctx.createBiquadFilter()
  highPass.type = 'highpass'
  highPass.frequency.value = 70
  source.connect(highPass)
  track(highPass)

  const body = ctx.createBiquadFilter()
  body.type = 'peaking'
  body.frequency.value = Math.min(220, frequency * 1.5)
  body.Q.value = 0.9
  body.gain.value = 5
  highPass.connect(body)
  track(body)

  const lowPass = ctx.createBiquadFilter()
  lowPass.type = 'lowpass'
  lowPass.frequency.value = 2200
  lowPass.Q.value = 0.5
  body.connect(lowPass)
  track(lowPass)

  return lowPass
}

/** Resumes or recreates the shared AudioContext after idle suspend. */
export async function warmReferenceAudio(): Promise<void> {
  await reassertAudioSession()
  let ctx = getContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  if (ctx.state === 'running') {
    return
  }
  // Long idle / iOS can leave a context that will not resume — rebuild.
  context = null
  bufferCache.clear()
  ctx = getContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

/** Plays a short plucked-string reference tone for ear comparison. */
export async function playReferencePitch(pitch: Pitch): Promise<void> {
  clearPlayback()
  await warmReferenceAudio()

  const ctx = getContext()
  if (ctx.state !== 'running') {
    await ctx.resume()
  }

  const frequency = pitchToFrequency(pitch)
  const source = ctx.createBufferSource()
  source.buffer = pluckBuffer(ctx, frequency)

  const output = ctx.createGain()
  output.gain.setValueAtTime(OUTPUT_GAIN, ctx.currentTime)
  output.connect(ctx.destination)
  track(source, output)

  const chain = guitarChain(ctx, source, frequency)
  chain.connect(output)

  suppressPitchDetection(SUPPRESS_MS)
  source.start(0)

  stopTimer = setTimeout(clearPlayback, NOTE_DURATION_S * 1000 + 80)
}

onAppResume(() => {
  void warmReferenceAudio()
})
