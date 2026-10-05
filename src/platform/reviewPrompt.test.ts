import { describe, expect, it, vi } from 'vitest'

const { isNativePlatform, requestReview } = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  requestReview: vi.fn(async () => undefined),
}))

vi.mock('./runtime', () => ({
  isNativePlatform,
}))

vi.mock('@capacitor-community/in-app-review', () => ({
  InAppReview: { requestReview },
}))

describe('requestStoreReview', () => {
  it('is a no-op on web and asks StoreKit or Play only on native', async () => {
    const { requestStoreReview } = await import('./reviewPrompt')
    isNativePlatform.mockReturnValue(false)
    await requestStoreReview()
    expect(requestReview).not.toHaveBeenCalled()
    isNativePlatform.mockReturnValue(true)
    await requestStoreReview()
    expect(requestReview).toHaveBeenCalledOnce()
    requestReview.mockRejectedValueOnce(new Error('unavailable'))
    await expect(requestStoreReview()).resolves.toBeUndefined()
  })
})
