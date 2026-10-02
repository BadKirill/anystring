import { pitchToFrequency, type Pitch } from '../core/music'
import { PLUCK_VOICES, type PluckInstrument } from '../core/signal/pluckVoice'
import { normalizePluck, synthesizePluck } from '../core/signal/pluckedTone'
import { reassertAudioSession } from '../platform/audioSession'
import { onAppResume } from './appResume'
import { resumeAudioContext, STALE_BACKGROUND_MS } from './audioContextResume'
import { suppressPitchDetection } from './pitchGate'

// Below the lowest preset fundamental (five-string bass B0) so the preview
// keeps that fundamental instead of sounding an octave higher.
export const REFERENCE_HIGHPASS_HZ = 20
// Long enough to hide a waveform cut on a low bass note, short enough to feel instant.
export const REFERENCE_SWITCH_FADE_S = 0.03
const OUTPUT_GAIN = 0.88

interface LiveTone {
  readonly nodes: AudioNode[]
  readonly output: GainNode
  readonly source: AudioBufferSourceNode
  readonly startedAt: number
  readonly fadesIn: boolean
  cleanup: ReturnType<typeof setTimeout> | null
}

let context: AudioContext | null = null
let contextStale = false
let active: LiveTone | null = null
let retiring: LiveTone[] = []
const bufferCache = new Map<string, AudioBuffer>()

export function resetReferenceAudio(): void {
  releaseContext()
}

function releaseContext(): void {
  clearPlayback()
  const previous = context
  context = null
  bufferCache.clear()
  if (previous && previous.state !== 'closed') {
    void previous.close().catch(() => undefined)
  }
}

function getContext(): AudioContext {
  if (context?.state === 'closed') {
    releaseContext()
  }
  context ??= new AudioContext()
  return context
}

function disconnectTone(tone: LiveTone): void {
  clearTimeout(tone.cleanup ?? undefined)
  tone.cleanup = null
  for (const node of tone.nodes) {
    node.disconnect()
  }
}

function clearPlayback(): void {
  const ending = active
  active = null
  if (ending) {
    disconnectTone(ending)
  }
  for (const tone of retiring) {
    disconnectTone(tone)
  }
  retiring = []
}

function gainNow(tone: LiveTone, now: number): number {
  if (!tone.fadesIn) {
    return OUTPUT_GAIN
  }
  const elapsed = Math.max(0, now - tone.startedAt)
  return OUTPUT_GAIN * Math.min(1, elapsed / REFERENCE_SWITCH_FADE_S)
}

function stopSource(source: AudioBufferSourceNode, when: number): void {
  try {
    source.stop(when)
  } catch (error: unknown) {
    if (!(error instanceof DOMException)) {
      throw error
    }
  }
}

function retireTone(ctx: AudioContext, tone: LiveTone): void {
  const now = ctx.currentTime
  const end = now + REFERENCE_SWITCH_FADE_S
  tone.output.gain.cancelScheduledValues(now)
  tone.output.gain.setValueAtTime(gainNow(tone, now), now)
  tone.output.gain.linearRampToValueAtTime(0, end)
  stopSource(tone.source, end)
  if (tone.cleanup) {
    clearTimeout(tone.cleanup)
    tone.cleanup = null
  }
  retiring.push(tone)
  tone.cleanup = setTimeout(
    () => {
      disconnectTone(tone)
      retiring = retiring.filter((item) => item !== tone)
    },
    REFERENCE_SWITCH_FADE_S * 1000 + 40,
  )
}

function pluckBuffer(
  ctx: AudioContext,
  frequency: number,
  instrument: PluckInstrument,
): AudioBuffer {
  const key = `${instrument}:${String(frequency)}`
  const cached = bufferCache.get(key)
  if (cached) {
    return cached
  }
  const voice = PLUCK_VOICES[instrument]
  const samples = normalizePluck(
    synthesizePluck(frequency, ctx.sampleRate, voice.durationS, voice),
    0.92,
  )
  const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate)
  buffer.copyToChannel(samples, 0)
  bufferCache.set(key, buffer)
  return buffer
}

function keepFundamental(ctx: AudioContext, source: AudioNode): AudioNode {
  const highPass = ctx.createBiquadFilter()
  highPass.type = 'highpass'
  highPass.frequency.value = REFERENCE_HIGHPASS_HZ
  source.connect(highPass)
  return highPass
}

function armOutput(gain: AudioParam, now: number, fadesIn: boolean): void {
  if (!fadesIn) {
    gain.setValueAtTime(OUTPUT_GAIN, now)
    return
  }
  gain.setValueAtTime(0, now)
  gain.linearRampToValueAtTime(OUTPUT_GAIN, now + REFERENCE_SWITCH_FADE_S)
}

function beginTone(
  ctx: AudioContext,
  source: AudioBufferSourceNode,
  output: GainNode,
  fadesIn: boolean,
  durationMs: number,
): void {
  const now = ctx.currentTime
  armOutput(output.gain, now, fadesIn)
  output.connect(ctx.destination)
  const highPass = keepFundamental(ctx, source)
  highPass.connect(output)
  const tone: LiveTone = {
    nodes: [source, output, highPass],
    output,
    source,
    startedAt: now,
    fadesIn,
    cleanup: null,
  }
  active = tone
  source.start(now)
  tone.cleanup = setTimeout(() => {
    disconnectTone(tone)
    active = null
  }, durationMs + 80)
}

export async function warmReferenceAudio(): Promise<void> {
  reassertAudioSession()
  if (contextStale) {
    contextStale = false
    releaseContext()
  }
  if (await resumeAudioContext(getContext())) {
    return
  }
  releaseContext()
  await resumeAudioContext(getContext())
}

export async function playReferencePitch(
  pitch: Pitch,
  instrument: PluckInstrument = 'guitar',
): Promise<void> {
  await warmReferenceAudio()
  const ctx = getContext()
  await resumeAudioContext(ctx)

  const previous = active
  active = null
  if (previous) {
    retireTone(ctx, previous)
  }

  const voice = PLUCK_VOICES[instrument]
  const source = ctx.createBufferSource()
  source.buffer = pluckBuffer(ctx, pitchToFrequency(pitch), instrument)
  const output = ctx.createGain()
  const durationMs = voice.durationS * 1000
  beginTone(ctx, source, output, previous !== null, durationMs)
  suppressPitchDetection(durationMs + 300)
}

onAppResume(({ hiddenMs }) => {
  if (hiddenMs >= STALE_BACKGROUND_MS) {
    contextStale = true
    return
  }
  void warmReferenceAudio().catch(() => undefined)
})
