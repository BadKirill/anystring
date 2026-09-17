import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SwipeableRow } from './SwipeableRow'

describe('SwipeableRow', () => {
  it('reveals edit and delete actions from a swipe', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    const onEdit = vi.fn()
    const { container } = render(
      <SwipeableRow onDelete={onDelete} onEdit={onEdit}>
        Row
      </SwipeableRow>,
    )
    const content = container.querySelector('.swipe-row-content')
    expect(content).toBeTruthy()
    if (!content) {
      throw new Error('missing swipe content')
    }
    fireEvent.touchStart(content, { touches: [{ clientX: 80 }] })
    fireEvent.touchMove(content, { touches: [{ clientX: 20 }] })
    fireEvent.touchEnd(content)
    expect(content.getAttribute('style')).toContain('-72px')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalled()
    fireEvent.touchStart(content, { touches: [{ clientX: 20 }] })
    fireEvent.touchMove(content, { touches: [{ clientX: 80 }] })
    fireEvent.touchEnd(content)
    expect(content.getAttribute('style')).toContain('72px')
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('snaps back when the swipe is too small or an action is missing', () => {
    const { container, rerender } = render(
      <SwipeableRow onDelete={vi.fn()}>Row</SwipeableRow>,
    )
    const content = container.querySelector('.swipe-row-content')
    if (!content) {
      throw new Error('missing swipe content')
    }
    fireEvent.touchStart(content, { touches: [{ clientX: 40 }] })
    fireEvent.touchMove(content, { touches: [{ clientX: 30 }] })
    fireEvent.touchEnd(content)
    expect(content.getAttribute('style')).toContain('0px')
    fireEvent.touchStart(content, { touches: [] })
    fireEvent.touchMove(content, { touches: [] })
    fireEvent.touchEnd(content)
    expect(content.getAttribute('style')).toContain('0px')
    rerender(<SwipeableRow>Row</SwipeableRow>)
    fireEvent.touchStart(content, { touches: [{ clientX: 80 }] })
    fireEvent.touchMove(content, { touches: [{ clientX: 0 }] })
    fireEvent.touchEnd(content)
    expect(content.getAttribute('style')).toContain('0px')
  })
})
