import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PRESET_TUNINGS } from '../core/tunings'
import { StringList } from './StringList'

vi.mock('../audio/referenceTone', () => ({
  playReferencePitch: vi.fn(() => Promise.resolve()),
  warmReferenceAudio: vi.fn(() => Promise.resolve()),
}))

describe('StringList', () => {
  it('selects a string on the first tap and edits on the second', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onEdit = vi.fn()
    const tuning = PRESET_TUNINGS[0]
    if (!tuning) {
      throw new Error('expected at least one preset tuning')
    }
    const { rerender } = render(
      <StringList
        tuning={tuning}
        activeIndex={0}
        manualIndex={null}
        onSelect={onSelect}
        onEdit={onEdit}
      />,
    )
    await user.click(screen.getByRole('button', { name: /E2/ }))
    expect(onSelect).toHaveBeenCalledWith(0)
    rerender(
      <StringList
        tuning={tuning}
        activeIndex={0}
        manualIndex={0}
        onSelect={onSelect}
        onEdit={onEdit}
      />,
    )
    await user.click(screen.getByRole('button', { name: /E2/ }))
    expect(onEdit).toHaveBeenCalledWith(0)
  })

  it('marks the rail as overflowing when the row is wider than the view', () => {
    const tuning = PRESET_TUNINGS[0]
    if (!tuning) {
      throw new Error('expected at least one preset tuning')
    }
    const { container } = render(
      <StringList
        tuning={tuning}
        activeIndex={null}
        manualIndex={null}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
      />,
    )
    const rail = container.querySelector('.string-list')
    expect(rail).toBeTruthy()
    if (!rail) {
      throw new Error('missing string list')
    }
    Object.defineProperty(rail, 'clientWidth', { configurable: true, value: 120 })
    Object.defineProperty(rail, 'scrollWidth', { configurable: true, value: 400 })
    fireEvent.scroll(rail)
    expect(rail.className).toContain('string-list-overflow')
  })
})
