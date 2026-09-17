import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AboutSheet } from './AboutSheet'
import { UI } from './strings'

describe('AboutSheet', () => {
  it('lists privacy, support, and source links', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AboutSheet onClose={onClose} />)
    expect(screen.getByText(UI.aboutTitle)).toBeTruthy()
    expect(screen.getByText(UI.aboutTagline)).toBeTruthy()
    expect(screen.getByRole('link', { name: UI.aboutPrivacyLink })).toHaveProperty(
      'href',
      'https://anystring.app/privacy.html',
    )
    expect(screen.getByRole('link', { name: UI.aboutSupportLink })).toBeTruthy()
    expect(screen.getByRole('link', { name: UI.aboutSourceLink })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: UI.close }))
    expect(onClose).toHaveBeenCalled()
  })
})
