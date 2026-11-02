import { describe, expect, it } from 'vitest'

import {
  foldFromReserved,
  layoutAxis,
  layoutGap,
  tunerLayout,
  type Fold,
  type LayoutSpace,
} from './tunerLayout'

const open: Fold = { active: false }

function space(
  width: number,
  height: number,
  fold: Fold = open,
  panes: 1 | 2 = 2,
): LayoutSpace {
  return { width, height, fold, panes }
}

describe('tunerLayout', () => {
  it('EC-duo-phone keeps a normal iPhone in the current column', () => {
    expect(tunerLayout(space(390, 844))).toEqual({ kind: 'stack' })
  })

  it('EC-duo-outer keeps the shorter cover display in one column', () => {
    expect(tunerLayout(space(466, 678))).toEqual({ kind: 'stack' })
  })

  it('EC-duo-short keeps a wide but short window in one column', () => {
    expect(tunerLayout(space(700, 500))).toEqual({ kind: 'stack' })
  })

  it('EC-duo-open widens the same column on the unfolded portrait display', () => {
    expect(tunerLayout(space(669, 951))).toEqual({ kind: 'grow' })
    expect(tunerLayout(space(669, 951, open, 1))).toEqual({ kind: 'grow' })
  })

  it('EC-duo-fold-vertical places the gauge and strings on either side of a book crease', () => {
    expect(
      tunerLayout(space(669, 951, { active: true, axis: 'vertical', band: 28 })),
    ).toEqual({ kind: 'split', axis: 'horizontal', gap: 28 })
  })

  it('EC-duo-fold-horizontal places the gauge and strings above and below a laptop crease', () => {
    expect(
      tunerLayout(space(669, 951, { active: true, axis: 'horizontal', band: 32 })),
    ).toEqual({ kind: 'split', axis: 'vertical', gap: 32 })
  })

  it('EC-duo-split-half keeps a narrow pane in one column even when a crease is reported', () => {
    expect(
      tunerLayout(space(334, 951, { active: true, axis: 'vertical', band: 12 })),
    ).toEqual({ kind: 'stack' })
  })

  it('EC-duo-fold-zero keeps the split and drops a missing or negative band', () => {
    const folded = space(669, 951, { active: true, axis: 'vertical', band: 0 })
    expect(tunerLayout(folded)).toEqual({ kind: 'split', axis: 'horizontal', gap: 0 })
    expect(
      tunerLayout({ ...folded, fold: { active: true, axis: 'vertical', band: -4 } }),
    ).toEqual({ kind: 'split', axis: 'horizontal', gap: 0 })
    expect(
      tunerLayout({
        ...folded,
        fold: { active: true, axis: 'vertical', band: Number.NaN },
      }),
    ).toEqual({ kind: 'split', axis: 'horizontal', gap: 0 })
  })

  it('EC-duo-landscape splits a regular window that is wider than it is tall', () => {
    const layout = tunerLayout(space(951, 669))
    expect(layout).toEqual({ kind: 'split', axis: 'horizontal', gap: 0 })
    expect(layoutGap(layout)).toBe(0)
    expect(layoutAxis(layout)).toBe('horizontal')
    expect(layoutGap({ kind: 'grow' })).toBe(0)
    expect(layoutAxis({ kind: 'stack' })).toBeNull()
  })

  it('EC-duo-invalid treats a missing viewport as the phone column', () => {
    expect(tunerLayout(space(0, 800))).toEqual({ kind: 'stack' })
    expect(tunerLayout(space(800, -1))).toEqual({ kind: 'stack' })
    expect(tunerLayout(space(Number.NaN, 800))).toEqual({ kind: 'stack' })
  })

  it('EC-duo-chromatic-hinge shifts the single pane off the crease and leaves an open landscape centered', () => {
    const shifted = tunerLayout(
      space(669, 951, { active: true, axis: 'vertical', band: 28 }, 1),
    )
    expect(shifted).toEqual({ kind: 'avoid', axis: 'horizontal', gap: 28 })
    expect(layoutGap(shifted)).toBe(28)
    expect(layoutAxis(shifted)).toBe('horizontal')
    expect(tunerLayout(space(951, 669, open, 1))).toEqual({ kind: 'grow' })
  })
})

describe('foldFromReserved', () => {
  const inner = { width: 669, height: 951 }

  it('EC-duo-region-empty ignores an empty region list', () => {
    expect(foldFromReserved([], inner)).toEqual({ active: false })
  })

  it('EC-duo-region-camera ignores a corner occlusion', () => {
    expect(
      foldFromReserved([{ active: true, x: 600, y: 0, width: 40, height: 40 }], inner),
    ).toEqual({ active: false })
  })

  it('EC-duo-region-inactive ignores a crease the system has turned off', () => {
    expect(
      foldFromReserved([{ active: false, x: 320, y: 0, width: 24, height: 951 }], inner),
    ).toEqual({ active: false })
  })

  it('EC-duo-region-vertical reads a tall center band as a vertical crease', () => {
    expect(
      foldFromReserved([{ active: true, x: 322, y: 0, width: 24, height: 951 }], inner),
    ).toEqual({ active: true, axis: 'vertical', band: 24 })
  })

  it('EC-duo-region-horizontal reads a wide center band as a horizontal crease', () => {
    expect(
      foldFromReserved([{ active: true, x: 0, y: 460, width: 669, height: 0 }], inner),
    ).toEqual({ active: true, axis: 'horizontal', band: 0 })
  })
})
