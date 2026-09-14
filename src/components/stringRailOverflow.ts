export interface ScrollMetrics {
  scrollLeft: number
  clientWidth: number
  scrollWidth: number
}

export interface StringRailOverflow {
  hasOverflow: boolean
  canScrollLeft: boolean
  canScrollRight: boolean
  maxScroll: number
}

const PIXEL_SLOP = 1

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function stringRailOverflow(metrics: ScrollMetrics): StringRailOverflow {
  const maxScroll = Math.max(0, metrics.scrollWidth - metrics.clientWidth)
  const hasOverflow = maxScroll > PIXEL_SLOP
  const scrollLeft = clamp(metrics.scrollLeft, 0, maxScroll)
  return {
    hasOverflow,
    canScrollLeft: hasOverflow && scrollLeft > PIXEL_SLOP,
    canScrollRight: hasOverflow && scrollLeft < maxScroll - PIXEL_SLOP,
    maxScroll,
  }
}
