import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ReviewPrompt } from './ReviewPrompt'
import { UI } from './strings'

describe('ReviewPrompt', () => {
  it('links to both stores and can be dismissed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ReviewPrompt onClose={onClose} />)
    expect(screen.getByText(UI.reviewPrompt)).toBeTruthy()
    expect(screen.getByRole('link', { name: UI.reviewAppStore })).toHaveProperty(
      'href',
      'https://apps.apple.com/app/id6806879721?action=write-review',
    )
    expect(
      screen.getByRole('link', { name: UI.reviewPlayStore }).getAttribute('href'),
    ).toContain('com.badkirill.anystring')
    await user.click(screen.getByRole('button', { name: UI.close }))
    expect(onClose).toHaveBeenCalled()
  })
})
