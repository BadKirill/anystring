import { useEffect, useState, type CSSProperties } from 'react'

import { useReservedRegions } from '../platform/fold'
import {
  foldFromReserved,
  layoutAxis,
  layoutGap,
  tunerLayout,
  type TunerLayout,
} from './tunerLayout'

export function readLayoutSpace(): { width: number; height: number } {
  const viewport = window.visualViewport
  if (viewport && viewport.width > 0 && viewport.height > 0) {
    return { width: viewport.width, height: viewport.height }
  }
  return { width: window.innerWidth, height: window.innerHeight }
}

export function useTunerLayout(panes: 1 | 2): TunerLayout {
  const [space, setSpace] = useState(readLayoutSpace)
  const regions = useReservedRegions()
  useEffect(() => {
    const onResize = (): void => {
      setSpace(readLayoutSpace())
    }
    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.visualViewport?.removeEventListener('resize', onResize)
    }
  }, [])
  return tunerLayout({
    width: space.width,
    height: space.height,
    fold: foldFromReserved(regions, space),
    panes,
  })
}

export function layoutStyle(layout: TunerLayout): CSSProperties {
  return { '--fold-gap': `${String(layoutGap(layout))}px` } as CSSProperties
}

export function layoutDataset(layout: TunerLayout): {
  'data-layout': TunerLayout['kind']
  'data-axis'?: 'horizontal' | 'vertical'
} {
  const axis = layoutAxis(layout)
  if (!axis) {
    return { 'data-layout': layout.kind }
  }
  return { 'data-layout': layout.kind, 'data-axis': axis }
}
