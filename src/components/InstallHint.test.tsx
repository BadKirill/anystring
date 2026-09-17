import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { InstallHint } from './InstallHint'
import { UI } from './strings'

const { isNativePlatform } = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
}))

vi.mock('../platform/runtime', () => ({
  isNativePlatform,
}))

function iosBrowser(): void {
  isNativePlatform.mockReturnValue(false)
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  })
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: query.includes('standalone'),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
}

describe('InstallHint', () => {
  it('stays hidden on native shells and non-iOS browsers', () => {
    isNativePlatform.mockReturnValue(true)
    const { rerender } = render(<InstallHint />)
    expect(screen.queryByText(UI.installHint)).toBeNull()
    isNativePlatform.mockReturnValue(false)
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 14)',
    })
    rerender(<InstallHint />)
    expect(screen.queryByText(UI.installHint)).toBeNull()
  })

  it('shows on iOS Safari and dismisses permanently', async () => {
    const user = userEvent.setup()
    iosBrowser()
    window.matchMedia = (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList
    const { unmount } = render(<InstallHint />)
    expect(screen.getByText(UI.installHint)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: UI.close }))
    expect(screen.queryByText(UI.installHint)).toBeNull()
    unmount()
    render(<InstallHint />)
    expect(screen.queryByText(UI.installHint)).toBeNull()
  })
})
