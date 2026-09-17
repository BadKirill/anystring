import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useLockBodyScroll } from './useLockBodyScroll'

describe('useLockBodyScroll', () => {
  it('locks html and body overflow while mounted', () => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    const { unmount } = renderHook(() => {
      useLockBodyScroll()
    })
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('auto')
    expect(document.documentElement.style.overflow).toBe('auto')
  })
})
