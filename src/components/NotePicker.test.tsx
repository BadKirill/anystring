import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { NotePicker } from './NotePicker'
import { UI } from './strings'

vi.mock('../audio/referenceTone', () => ({
  playReferencePitch: vi.fn(() => Promise.reject(new Error('silent'))),
  warmReferenceAudio: vi.fn(() => Promise.resolve()),
}))

describe('NotePicker', () => {
  it('previews a picked note and confirms the selection', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(
      <NotePicker
        initial={{ note: 'E', octave: 2 }}
        onConfirm={onConfirm}
        onClose={onClose}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: '3' }))
    await user.click(screen.getByRole('button', { name: UI.done }))
    expect(onConfirm).toHaveBeenCalledWith({ note: 'A', octave: 3 })
  })
})
