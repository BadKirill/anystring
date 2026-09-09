import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'

import {
  stringRailOverflow,
  type ScrollMetrics,
  type StringRailOverflow,
} from './stringRailOverflow'

const EMPTY_METRICS: ScrollMetrics = {
  scrollLeft: 0,
  clientWidth: 0,
  scrollWidth: 0,
}

export function useStringRailScroll(itemCount: number): {
  ref: RefObject<HTMLDivElement | null>
  overflow: StringRailOverflow
  metrics: ScrollMetrics
  onScroll: () => void
  setScrollLeft: (left: number) => void
} {
  const ref = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState<ScrollMetrics>(EMPTY_METRICS)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) {
      return
    }
    setMetrics({
      scrollLeft: el.scrollLeft,
      clientWidth: el.clientWidth,
      scrollWidth: el.scrollWidth,
    })
  }, [])

  useLayoutEffect(() => {
    measure()
    const el = ref.current
    if (!el) {
      return
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [itemCount, measure])

  const setScrollLeft = (left: number) => {
    const el = ref.current
    if (!el) {
      return
    }
    el.scrollLeft = left
    measure()
  }

  return {
    ref,
    overflow: stringRailOverflow(metrics),
    metrics,
    onScroll: measure,
    setScrollLeft,
  }
}
