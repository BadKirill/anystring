import { describe, expect, it, vi } from 'vitest'

const isNativePlatform = vi.fn(() => false)
const getPlatform = vi.fn(() => 'web')

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform, getPlatform },
}))

describe('runtime', () => {
  it('delegates native detection to Capacitor', async () => {
    const { isNativePlatform: read, analyticsPlatform } = await import('./runtime')
    isNativePlatform.mockReturnValue(false)
    expect(read()).toBe(false)
    expect(analyticsPlatform()).toBe('web')
    isNativePlatform.mockReturnValue(true)
    getPlatform.mockReturnValue('ios')
    expect(read()).toBe(true)
    expect(analyticsPlatform()).toBe('ios')
    getPlatform.mockReturnValue('android')
    expect(analyticsPlatform()).toBe('android')
  })
})
