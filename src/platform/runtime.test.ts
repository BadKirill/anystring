import { describe, expect, it, vi } from 'vitest'

const isNativePlatform = vi.fn(() => false)

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform },
}))

describe('isNativePlatform', () => {
  it('delegates to Capacitor', async () => {
    const { isNativePlatform: read } = await import('./runtime')
    isNativePlatform.mockReturnValue(false)
    expect(read()).toBe(false)
    isNativePlatform.mockReturnValue(true)
    expect(read()).toBe(true)
  })
})
