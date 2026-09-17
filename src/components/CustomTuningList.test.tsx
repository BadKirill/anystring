import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CustomTuningList } from './CustomTuningList'
import { UI } from './strings'
import type { Tuning } from '../core/tunings'

const TUNING: Tuning = {
  id: 'custom-1',
  name: 'Demiurge',
  instrument: 'bass',
  strings: [{ pitch: { note: 'F', octave: 1 } }],
}

describe('CustomTuningList', () => {
  it('shows the empty-state copy until a tuning is saved', () => {
    render(
      <CustomTuningList
        tunings={[]}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onRename={vi.fn()}
      />,
    )
    expect(screen.getByText(UI.noCustomTunings)).toBeTruthy()
  })

  it('selects, deletes, and renames a saved tuning', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onDelete = vi.fn()
    const onRename = vi.fn()
    render(
      <CustomTuningList
        tunings={[TUNING]}
        onSelect={onSelect}
        onDelete={onDelete}
        onRename={onRename}
      />,
    )
    await user.click(screen.getByText('Demiurge'))
    expect(onSelect).toHaveBeenCalledWith(TUNING)
    await user.click(screen.getByText(UI.delete))
    expect(onDelete).toHaveBeenCalledWith('custom-1')
    await user.click(screen.getByText(UI.rename))
    const field = screen.getByPlaceholderText(UI.namePlaceholder)
    await user.clear(field)
    await user.type(field, 'New')
    await user.click(screen.getByRole('button', { name: UI.save }))
    expect(onRename).toHaveBeenCalledWith('custom-1', 'New')
  })

  it('does not rename when the edited name is blank', async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(
      <CustomTuningList
        tunings={[TUNING]}
        showEmptyHint={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onRename={onRename}
      />,
    )
    await user.click(screen.getByText(UI.rename))
    await user.clear(screen.getByPlaceholderText(UI.namePlaceholder))
    await user.click(screen.getByRole('button', { name: UI.save }))
    expect(onRename).not.toHaveBeenCalled()
  })
})
