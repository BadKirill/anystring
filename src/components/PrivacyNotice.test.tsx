import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { memoryStorage } from '../test/memoryStorage'
import { readPrivacyAccepted } from '../storage/privacyNotice'
import { PrivacyNotice } from './PrivacyNotice'
import { UI } from './strings'

describe('PrivacyNotice', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
  })

  it('links to the privacy policy and hides after agreement', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<PrivacyNotice />)
    expect(screen.getByText(UI.privacyNotice)).toBeTruthy()
    expect(screen.getByRole('link', { name: UI.aboutPrivacyLink })).toHaveProperty(
      'href',
      'https://anystring.app/privacy.html',
    )
    await user.click(screen.getByRole('button', { name: UI.privacyAgree }))
    expect(screen.queryByText(UI.privacyNotice)).toBeNull()
    expect(readPrivacyAccepted()).toBe('2026-10-05')
    unmount()
    render(<PrivacyNotice />)
    expect(screen.queryByText(UI.privacyNotice)).toBeNull()
  })

  it('EC-privacy-quota: stays visible when the agreement cannot be stored', async () => {
    const user = userEvent.setup()
    const store = memoryStorage()
    store.setItem = () => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
    }
    vi.stubGlobal('localStorage', store)
    render(<PrivacyNotice />)
    await user.click(screen.getByRole('button', { name: UI.privacyAgree }))
    expect(screen.getByText(UI.privacyNotice)).toBeTruthy()
  })
})
