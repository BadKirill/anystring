import { useEffect } from 'react'

/**
 * Prevents the page behind a modal sheet from scrolling while mounted.
 *
 * Avoid `position: fixed` on body — on iOS WKWebView it desyncs the visual
 * viewport from hit-testing, so buttons look tappable but receive no clicks.
 */
export function useLockBodyScroll(): void {
  useEffect(() => {
    const { style } = document.body
    const htmlStyle = document.documentElement.style
    const previousBodyOverflow = style.overflow
    const previousHtmlOverflow = htmlStyle.overflow

    style.overflow = 'hidden'
    htmlStyle.overflow = 'hidden'

    return () => {
      style.overflow = previousBodyOverflow
      htmlStyle.overflow = previousHtmlOverflow
    }
  }, [])
}
