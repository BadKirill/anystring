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

function phoneViewport(): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 844 })
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: {
      width: 390,
      height: 844,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  })
}

phoneViewport()

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.stubGlobal('ResizeObserver', ImmediateResizeObserver)
  phoneViewport()
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => 'visible',
  })
})
