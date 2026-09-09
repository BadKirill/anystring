import { describe, expect, it } from 'vitest'

import { stringRailOverflow } from './stringRailOverflow'

describe('stringRailOverflow', () => {
  it('has no overflow when every string fits in the row', () => {
    expect(
      stringRailOverflow({ scrollLeft: 0, clientWidth: 360, scrollWidth: 352 }),
    ).toEqual({
      hasOverflow: false,
      canScrollLeft: false,
      canScrollRight: false,
      maxScroll: 0,
    })
  })

  it('points right when extra strings sit past the visible edge', () => {
    expect(
      stringRailOverflow({ scrollLeft: 0, clientWidth: 360, scrollWidth: 520 }),
    ).toEqual({
      hasOverflow: true,
      canScrollLeft: false,
      canScrollRight: true,
      maxScroll: 160,
    })
  })

  it('points both ways in the middle of a long row', () => {
    expect(
      stringRailOverflow({ scrollLeft: 80, clientWidth: 360, scrollWidth: 520 }),
    ).toEqual({
      hasOverflow: true,
      canScrollLeft: true,
      canScrollRight: true,
      maxScroll: 160,
    })
  })

  it('points left when the last strings are in view', () => {
    expect(
      stringRailOverflow({ scrollLeft: 160, clientWidth: 360, scrollWidth: 520 }),
    ).toEqual({
      hasOverflow: true,
      canScrollLeft: true,
      canScrollRight: false,
      maxScroll: 160,
    })
  })
})
