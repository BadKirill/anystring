import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

class ImmediateResizeObserver {
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(): void {
    this.callback([], this)
  }

  unobserve(): void {
    return
  }

  disconnect(): void {
    return
  }
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  configurable: true,
  value: () => undefined,
})

vi.stubGlobal('ResizeObserver', ImmediateResizeObserver)

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.stubGlobal('ResizeObserver', ImmediateResizeObserver)
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => 'visible',
  })
})
