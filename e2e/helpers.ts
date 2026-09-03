import type { Page } from '@playwright/test'

declare global {
  interface Window {
    __setTestToneHz?: (hz: number) => void
    __referenceTonePlayCount?: number
    __simulateBackground?: (hiddenMs: number) => Promise<void>
  }
}

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

export async function setTestTone(page: Page, hz: number): Promise<void> {
  await page.evaluate((nextHz: number) => {
    if (!window.__setTestToneHz) {
      throw new Error('Microphone stub is not active')
    }
    window.__setTestToneHz(nextHz)
  }, hz)
}

export async function stubMicrophoneDenied(page: Page): Promise<void> {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Permission denied', 'NotAllowedError'))
  })
}

export async function stubMicrophoneMissing(page: Page): Promise<void> {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Requested device not found', 'NotFoundError'))
  })
}

export async function stubMicrophoneUnavailable(page: Page): Promise<void> {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('Could not start audio source', 'AbortError'))
  })
}

export async function spyReferenceTone(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.__referenceTonePlayCount = 0
    const proto = AudioBufferSourceNode.prototype

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

export async function referenceTonePlayCount(page: Page): Promise<number> {
  return page.evaluate(() => window.__referenceTonePlayCount ?? 0)
}

/**
 * Emulates iOS after a long background: every AudioContext alive at that moment
 * is suspended for good — its resume() promise never settles — and the wall
 * clock jumps forward. Call before page.goto(), drive with simulateBackground().
 */
export async function stubLongBackground(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const live: AudioContext[] = []
    const dead = new WeakSet<AudioContext>()
    let clockOffsetMs = 0
    let hidden = false

    const realNow = Date.now.bind(Date)
    Date.now = () => realNow() + clockOffsetMs

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (hidden ? 'hidden' : 'visible'),
    })

    const BaseAudioContext = window.AudioContext
    const proto = BaseAudioContext.prototype
    // Bound calls keep the instance `this` when the methods are stored unbound.
    /* eslint-disable @typescript-eslint/unbound-method -- re-applied via call.bind */
    const originalResume = Function.prototype.call.bind(proto.resume) as (
      thisArg: AudioContext,
    ) => Promise<void>
    const originalSuspend = Function.prototype.call.bind(proto.suspend) as (
      thisArg: AudioContext,
    ) => Promise<void>
    /* eslint-enable @typescript-eslint/unbound-method */

    proto.resume = function resumePatched(this: AudioContext): Promise<void> {
      if (dead.has(this)) {
        return new Promise<void>(() => undefined)
      }
      return originalResume(this)
    }

    window.AudioContext = class TrackedAudioContext extends BaseAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options)
        live.push(this)
      }
    }

    const setHidden = (next: boolean) => {
      hidden = next
      document.dispatchEvent(new Event('visibilitychange'))
    }

    window.__simulateBackground = async (hiddenMs: number) => {
      setHidden(true)
      for (const context of live.splice(0)) {
        dead.add(context)
        if (context.state !== 'closed') {
          await originalSuspend(context)
        }
      }
      clockOffsetMs += hiddenMs
      setHidden(false)
    }
  })
}

/** Backgrounds the app for hiddenMs of simulated time (needs stubLongBackground). */
export async function simulateBackground(page: Page, hiddenMs: number): Promise<void> {
  await page.evaluate(async (ms: number) => {
    if (!window.__simulateBackground) {
      throw new Error('Background stub is not active')
    }
    await window.__simulateBackground(ms)
  }, hiddenMs)
}

export const APP_URL = '/app/'

export async function clearTuningStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

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
