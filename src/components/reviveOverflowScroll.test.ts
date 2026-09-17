import { describe, expect, it } from 'vitest'

import { reviveOverflowScroll } from './reviveOverflowScroll'

function frozenScroller(): { style: { overflowX: string }; offsetWidth: number } {
  let overflowX = 'hidden'
  return {
    style: {
      get overflowX() {
        return overflowX
      },
      set overflowX(value: string) {
        overflowX = value
      },
    },
    offsetWidth: 240,
  }
}

describe('reviveOverflowScroll', () => {
  it('clears an inline overflow freeze after reading layout', () => {
    const el = frozenScroller()
    const reads: number[] = []
    Object.defineProperty(el, 'offsetWidth', {
      get() {
        reads.push(1)
        return 240
      },
    })

    reviveOverflowScroll(el)

    expect(reads).toEqual([1])
    expect(el.style.overflowX).toBe('')
  })
})
