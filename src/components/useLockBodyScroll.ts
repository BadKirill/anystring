import { useEffect } from 'react'

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
