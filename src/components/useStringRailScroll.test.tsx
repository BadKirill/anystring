import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useStringRailScroll } from './useStringRailScroll'

function Rail({ count }: { count: number }) {
  const rail = useStringRailScroll(count)
  return (
    <div>
      <div
        ref={rail.ref}
        data-testid="scroller"
        data-overflow={String(rail.overflow.hasOverflow)}
        data-right={String(rail.overflow.canScrollRight)}
        onScroll={rail.onScroll}
      />
    </div>
  )
}

describe('useStringRailScroll', () => {
  it('measures overflow after layout and scroll', () => {
    const { getByTestId, rerender } = render(<Rail count={8} />)
    const scroller = getByTestId('scroller')
    Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 200 })
    Object.defineProperty(scroller, 'scrollWidth', { configurable: true, value: 400 })
    Object.defineProperty(scroller, 'scrollLeft', { configurable: true, value: 0 })
    rerender(<Rail count={8} />)
    fireEvent.scroll(scroller)
    expect(scroller.dataset.overflow).toBe('true')
    expect(scroller.dataset.right).toBe('true')
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(scroller.style.overflowX).toBe('')
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(scroller.style.overflowX).toBe('')
  })
})
