import { registerPlugin } from '@capacitor/core'

import { isNativePlatform } from './runtime'

/** `capture` keeps the microphone input open; `playback` is output only. */
export type AudioSessionMode = 'playback' | 'capture'

interface AudioSessionPlugin {
  activate(options: { mode: AudioSessionMode }): Promise<void>
}

const plugin = registerPlugin<AudioSessionPlugin>('AudioSession')

let mode: AudioSessionMode = 'playback'

async function apply(): Promise<void> {
  if (!isNativePlatform()) {
    return
  }
  try {
    await plugin.activate({ mode })
  } catch {
    // Browsers and PWAs have no session to arm; never block audio over it.
  }
}

/**
 * Tells the native shell whether the microphone is running. While it is, iOS
 * already keeps the app audible and the session is left alone; when capture
 * stops the shell re-arms playback so tones survive the silent switch.
 */
export async function setAudioSessionMode(next: AudioSessionMode): Promise<void> {
  mode = next
  await apply()
}

/**
 * Re-arms the session with the current mode. iOS mutes an ambient session under
 * the ring/silent switch, and WKWebView drops back to one whenever it starts or
 * stops media, so tones re-assert the category right before they play.
 */
export async function reassertAudioSession(): Promise<void> {
  await apply()
}
