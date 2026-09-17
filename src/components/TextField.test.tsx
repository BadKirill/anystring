import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TextField } from './TextField'

describe('TextField', () => {
  it('notifies on change, Enter, and clear', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onSubmit = vi.fn()
    const { rerender } = render(
      <TextField
        value=""
        placeholder="Tuning name"
        onChange={onChange}
        onSubmit={onSubmit}
      />,
    )
    await user.type(screen.getByPlaceholderText('Tuning name'), 'A')
    expect(onChange).toHaveBeenCalledWith('A')
    rerender(
      <TextField
        value="A"
        placeholder="Tuning name"
        aria-label="Name"
        onChange={onChange}
        onSubmit={onSubmit}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onChange).toHaveBeenCalledWith('')
    await user.type(screen.getByLabelText('Name'), '{Enter}')
    expect(onSubmit).toHaveBeenCalled()
  })
})
