import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const isNativePlatform = vi.fn(() => false)
const getPlatform = vi.fn(() => 'web')
const read = vi.fn()
const addListener = vi.fn()

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform, getPlatform },
  registerPlugin: () => ({ read, addListener }),
}))

describe('fold bridge', () => {
  it('EC-duo-bridge-web reports no regions off iOS', async () => {
    const { readReservedRegions, subscribeReservedRegions } = await import('./fold')
    isNativePlatform.mockReturnValue(false)
    getPlatform.mockReturnValue('web')
    read.mockClear()
    await expect(readReservedRegions()).resolves.toEqual([])
    isNativePlatform.mockReturnValue(true)
    getPlatform.mockReturnValue('android')
    await expect(readReservedRegions()).resolves.toEqual([])
    expect(read).not.toHaveBeenCalled()
    const unsubscribe = subscribeReservedRegions(() => undefined)
    expect(addListener).not.toHaveBeenCalled()
    unsubscribe()
  })

  it('EC-duo-bridge-denied treats a missing plugin as an open display', async () => {
    const { readReservedRegions } = await import('./fold')
    isNativePlatform.mockReturnValue(true)
    getPlatform.mockReturnValue('ios')
    read.mockRejectedValue(new Error('missing'))
    await expect(readReservedRegions()).resolves.toEqual([])
  })

  it('EC-duo-bridge-corrupt drops regions that are not rectangles', async () => {
    const { readReservedRegions, useReservedRegions } = await import('./fold')
    isNativePlatform.mockReturnValue(true)
    getPlatform.mockReturnValue('ios')
    const region = { active: true, x: 10, y: 0, width: 20, height: 100 }
    read.mockResolvedValue({
      regions: [region, { active: true, x: 'nope' }, null, 4],
    })
    await expect(readReservedRegions()).resolves.toEqual([region])
    read.mockResolvedValue({ regions: 'nope' })
    await expect(readReservedRegions()).resolves.toEqual([])

    const remove = vi.fn(async () => undefined)
    addListener.mockResolvedValue({ remove })
    const { unmount } = renderHook(() => useReservedRegions())
    await waitFor(() => {
      expect(addListener).toHaveBeenCalled()
    })
    unmount()
    await waitFor(() => {
      expect(remove).toHaveBeenCalled()
    })
  })

  it('ignores a listener the plugin cannot register', async () => {
    const { subscribeReservedRegions } = await import('./fold')
    isNativePlatform.mockReturnValue(true)
    getPlatform.mockReturnValue('ios')
    addListener.mockRejectedValue(new Error('unavailable'))
    expect(() => {
      subscribeReservedRegions(() => undefined)()
    }).not.toThrow()
    await Promise.resolve()
  })

  it('drops a listener that arrives after unsubscribe', async () => {
    const { subscribeReservedRegions } = await import('./fold')
    isNativePlatform.mockReturnValue(true)
    getPlatform.mockReturnValue('ios')
    let resolveListener: (handle: { remove: () => Promise<void> }) => void = () =>
      undefined
    addListener.mockReturnValue(
      new Promise((resolve) => {
        resolveListener = resolve
      }),
    )
    const lateRemove = vi.fn(async () => undefined)
    const unsubscribe = subscribeReservedRegions(() => undefined)
    unsubscribe()
    resolveListener({ remove: lateRemove })
    await waitFor(() => {
      expect(lateRemove).toHaveBeenCalled()
    })
  })
})
