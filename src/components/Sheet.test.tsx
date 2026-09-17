import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Sheet } from './Sheet'
import { UI } from './strings'

describe('Sheet', () => {
  it('closes from the overlay and the footer, not from inside the panel', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { rerender } = render(
      <Sheet onClose={onClose}>
        <p>Body</p>
      </Sheet>,
    )
    expect(document.body.style.overflow).toBe('hidden')
    await user.click(screen.getByText('Body'))
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: UI.close }))
    expect(onClose).toHaveBeenCalledTimes(1)
    await user.click(screen.getByText('Body').closest('.overlay') ?? document.body)
    expect(onClose).toHaveBeenCalledTimes(2)
    rerender(
      <Sheet onClose={onClose} tall>
        <p>Body</p>
      </Sheet>,
    )
    expect(document.querySelector('.sheet-tall')).toBeTruthy()
  })
})
