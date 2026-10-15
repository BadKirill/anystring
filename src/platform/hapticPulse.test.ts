import { beforeEach, describe, expect, it, vi } from 'vitest'

const { impact, isNativePlatform } = vi.hoisted(() => ({
  impact: vi.fn(),
  isNativePlatform: vi.fn(() => false),
}))

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact },
  ImpactStyle: { Light: 'LIGHT' },
}))

vi.mock('./runtime', () => ({
  isNativePlatform,
}))

import { pulseHaptic } from './hapticPulse'

function setVibrate(value: ((ms: number) => boolean) | undefined): void {
  Object.defineProperty(navigator, 'vibrate', {
    configurable: true,
    writable: true,
    value,
  })
}

describe('pulseHaptic', () => {
  beforeEach(() => {
    impact.mockReset()
    impact.mockResolvedValue(undefined)
    isNativePlatform.mockReturnValue(false)
    setVibrate(undefined)
  })

  it('EC-haptic-missing does not throw when vibrate and the native plugin are absent', () => {
    expect(() => {
      pulseHaptic()
    }).not.toThrow()
    expect(impact).not.toHaveBeenCalled()
  })

  it('vibrates for 20ms in the browser when the API exists', () => {
    const vibrate = vi.fn(() => true)
    setVibrate(vibrate)
    pulseHaptic()
    expect(vibrate).toHaveBeenCalledWith(20)
    expect(impact).not.toHaveBeenCalled()
  })

  it('uses a light impact on a native shell', () => {
    isNativePlatform.mockReturnValue(true)
    pulseHaptic()
    expect(impact).toHaveBeenCalledWith({ style: 'LIGHT' })
  })

  it('swallows a native impact that throws or rejects', async () => {
    isNativePlatform.mockReturnValue(true)
    impact.mockImplementation(() => {
      throw new Error('plugin missing')
    })
    expect(() => {
      pulseHaptic()
    }).not.toThrow()

    impact.mockReturnValue(Promise.reject(new Error('plugin missing')))
    expect(() => {
      pulseHaptic()
    }).not.toThrow()
    await Promise.resolve()
  })

  it('swallows a browser vibrate that throws', () => {
    setVibrate(() => {
      throw new Error('blocked')
    })
    expect(() => {
      pulseHaptic()
    }).not.toThrow()
  })
})
