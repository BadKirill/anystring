import { registerPlugin } from '@capacitor/core'

import { isNativePlatform } from './runtime'

/** `capture` keeps the microphone input open; `playback` is output only. */
export type AudioSessionMode = 'playback' | 'capture'

type WebAudioSessionType =
  'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record'

interface AudioSessionPlugin {
  activate(options: { mode: AudioSessionMode }): Promise<void>
}

/**
 * Tiny silent WAV. Playing an HTMLAudioElement is what actually flips
 * WKWebView's *own* session out of Ambient — the app AVAudioSession cannot.
 */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

const plugin = registerPlugin<AudioSessionPlugin>('AudioSession')

let mode: AudioSessionMode = 'playback'
let unlockEl: HTMLAudioElement | null = null

function webTypeFor(next: AudioSessionMode): WebAudioSessionType {
  return next === 'capture' ? 'play-and-record' : 'playback'
}

/** Declares intent to the Web Audio Session API (iOS 17+ / Safari). */
function applyWebAudioSessionType(): void {
  const session = navigator.audioSession
  if (!session) {
    return
  }
  session.type = webTypeFor(mode)
}

/**
 * Holds WKWebView in Playback by keeping a muted silent <audio> looping.
 * Without this (or navigator.audioSession), Web Audio stays Ambient and the
 * ring/silent switch mutes every reference tone.
 */
async function holdWebKitPlayback(): Promise<void> {
  if (typeof Audio === 'undefined') {
    return
  }
  unlockEl ??= new Audio(SILENT_WAV)
  unlockEl.loop = true
  unlockEl.volume = 0.01
  try {
    await unlockEl.play()
    unlockEl.muted = true
  } catch {
    // First call may land before a user gesture; the tone tap retries.
  }
}

async function applyNativePlugin(): Promise<void> {
  if (!isNativePlatform()) {
    return
  }
  try {
    await plugin.activate({ mode })
  } catch {
    // Native seam is best-effort; the web unlock above is what matters.
  }
}

/**
 * Switches between output-only and mic capture. Updates the web session type
 * on every platform; the Capacitor plugin is an extra native hint.
 */
export async function setAudioSessionMode(next: AudioSessionMode): Promise<void> {
  mode = next
  applyWebAudioSessionType()
  await applyNativePlugin()
  if (mode === 'playback') {
    await holdWebKitPlayback()
  }
}

/**
 * Re-arms audible playback before a reference tone. Must run on the web side:
 * WKWebView ignores the app AVAudioSession, so native-only fixes stay silent.
 */
export async function reassertAudioSession(): Promise<void> {
  applyWebAudioSessionType()
  await holdWebKitPlayback()
  await applyNativePlugin()
}
