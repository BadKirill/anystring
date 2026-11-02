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
    expect(vibrate).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenCalledWith(20)
    expect(impact).not.toHaveBeenCalled()
  })

  it('does not throw when vibrate reports that it did not run', () => {
    const vibrate = vi.fn(() => false)
    setVibrate(vibrate)
    expect(() => {
      pulseHaptic()
    }).not.toThrow()
    expect(vibrate).toHaveBeenCalledTimes(1)
    expect(vibrate).toHaveBeenCalledWith(20)
    expect(impact).not.toHaveBeenCalled()
  })

  it('EC-haptic-native taps once with a light impact and does not vibrate', () => {
    isNativePlatform.mockReturnValue(true)
    const vibrate = vi.fn(() => true)
    setVibrate(vibrate)
    pulseHaptic()
    expect(impact).toHaveBeenCalledTimes(1)
    expect(impact).toHaveBeenCalledWith({ style: 'LIGHT' })
    expect(vibrate).not.toHaveBeenCalled()
  })

  it('swallows a native impact that throws or rejects', async () => {
    isNativePlatform.mockReturnValue(true)
    const vibrate = vi.fn(() => true)
    setVibrate(vibrate)
    impact.mockImplementation(() => {
      throw new Error('plugin missing')
    })
    expect(() => {
      pulseHaptic()
    }).not.toThrow()
    expect(impact).toHaveBeenCalledTimes(1)
    expect(vibrate).not.toHaveBeenCalled()

    impact.mockReturnValue(Promise.reject(new Error('plugin missing')))
    expect(() => {
      pulseHaptic()
    }).not.toThrow()
    await Promise.resolve()
    expect(impact).toHaveBeenCalledTimes(2)
    expect(vibrate).not.toHaveBeenCalled()
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
