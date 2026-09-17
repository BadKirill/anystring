import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'

import { onAppResume } from '../audio/appResume'
import {
  stringRailOverflow,
  type ScrollMetrics,
  type StringRailOverflow,
} from './stringRailOverflow'
import { reviveOverflowScroll } from './reviveOverflowScroll'

const EMPTY_METRICS: ScrollMetrics = {
  scrollLeft: 0,
  clientWidth: 0,
  scrollWidth: 0,
}

function subscribeScroller(el: HTMLDivElement, measure: () => void): () => void {
  const observer = new ResizeObserver(measure)
  observer.observe(el)
  const revive = () => {
    reviveOverflowScroll(el)
    measure()
  }
  const onVisible = () => {
    if (document.visibilityState === 'hidden') {
      return
    }
    revive()
  }
  document.addEventListener('visibilitychange', onVisible)
  const stopResume = onAppResume(revive)
  return () => {
    observer.disconnect()
    document.removeEventListener('visibilitychange', onVisible)
    stopResume()
  }
}

export function useStringRailScroll(itemCount: number): {
  ref: RefObject<HTMLDivElement | null>
  overflow: StringRailOverflow
  onScroll: () => void
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
    return subscribeScroller(el, measure)
  }, [itemCount, measure])

  return {
    ref,
    overflow: stringRailOverflow(metrics),
    onScroll: measure,
  }
}
