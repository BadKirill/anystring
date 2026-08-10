import type { Page } from '@playwright/test'

declare global {
  interface Window {
    __setTestToneHz?: (hz: number) => void
    __referenceTonePlayCount?: number
  }
}

/**
 * Replaces getUserMedia with a synthetic oscillator "microphone" so the whole
 * pipeline (worklet -> pitch detection -> analyzer -> UI) runs deterministically.
 * Call before page.goto(). Change the tone later with setTestTone().
 */
export async function stubMicrophone(page: Page, initialHz: number): Promise<void> {
  await page.addInitScript((hz: number) => {
    navigator.mediaDevices.getUserMedia = () => {
      const ctx = new AudioContext()
      const destination = ctx.createMediaStreamDestination()

      const fundamental = ctx.createOscillator()
      fundamental.frequency.value = hz
      fundamental.connect(destination)

      const second = ctx.createOscillator()
      second.frequency.value = hz * 2
      const secondGain = ctx.createGain()
      secondGain.gain.value = 0.45
      second.connect(secondGain)
      secondGain.connect(destination)

      window.__setTestToneHz = (nextHz: number) => {
        const now = ctx.currentTime
        fundamental.frequency.setValueAtTime(nextHz, now)
        second.frequency.setValueAtTime(nextHz * 2, now)
      }

      fundamental.start()
      second.start()
      return Promise.resolve(destination.stream)
    }
  }, initialHz)
}

/** Retunes the stubbed microphone tone while a session is running. */
export async function setTestTone(page: Page, hz: number): Promise<void> {
  await page.evaluate((nextHz: number) => {
    if (!window.__setTestToneHz) {
      throw new Error('Microphone stub is not active')
    }
    window.__setTestToneHz(nextHz)
  }, hz)
}

/** Simulates a user denying the microphone permission prompt. */
export async function stubMicrophoneDenied(page: Page): Promise<void> {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Permission denied', 'NotAllowedError'))
  })
}

/** Simulates a device with no microphone hardware. */
export async function stubMicrophoneMissing(page: Page): Promise<void> {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Requested device not found', 'NotFoundError'))
  })
}

/** Simulates a generic getUserMedia failure (busy device, etc.). */
export async function stubMicrophoneUnavailable(page: Page): Promise<void> {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Could not start audio source', 'AbortError'))
  })
}

/**
 * Counts AudioBufferSourceNode.start() calls used by reference-tone playback.
 * Oscillator mic stubs do not use buffer sources, so the count stays tone-only.
 * Call before page.goto().
 */
export async function spyReferenceTone(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__referenceTonePlayCount = 0
    const proto = AudioBufferSourceNode.prototype
    // Bound call keeps the instance `this` when the method is stored unbound.
    // eslint-disable-next-line @typescript-eslint/unbound-method -- re-applied via call.bind
    const originalStart = Function.prototype.call.bind(proto.start) as (
      thisArg: AudioBufferSourceNode,
      when?: number,
      offset?: number,
      duration?: number,
    ) => void
    proto.start = function startPatched(
      this: AudioBufferSourceNode,
      when?: number,
      offset?: number,
      duration?: number,
    ): void {
      window.__referenceTonePlayCount = (window.__referenceTonePlayCount ?? 0) + 1
      originalStart(this, when, offset, duration)
    }
  })
}

/** Current number of reference-tone buffer plays recorded by spyReferenceTone. */
export async function referenceTonePlayCount(page: Page): Promise<number> {
  return page.evaluate(() => window.__referenceTonePlayCount ?? 0)
}

export const APP_URL = '/app/'

/** Clears persisted tunings so e2e tests start from a known empty state. */
export async function clearTuningStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Simulates iOS Safari where list writes fail but the active tuning key still saves.
 * Call before page.goto().
 */
export async function blockCustomTuningListWrites(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const shouldBlock = (key: string) =>
      key.includes('customTunings') && !key.includes('activeTuning')

    for (const storage of [localStorage, sessionStorage]) {
      const originalSetItem = storage.setItem.bind(storage)
      storage.setItem = (key: string, value: string) => {
        if (shouldBlock(key)) {
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
        }
        originalSetItem(key, value)
      }
    }
  })
}
