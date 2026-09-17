import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { usePitch } from './usePitch'

vi.mock('./useMicControls', () => ({
  useMicControls: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
}))

describe('usePitch', () => {
  it('starts idle and exposes start/stop controls', () => {
    const { result } = renderHook(() => usePitch())
    expect(result.current.status).toBe('idle')
    expect(result.current.frequency).toBeNull()
    expect(result.current.clarity).toBeNull()
    expect(result.current.error).toBeNull()
    expect(typeof result.current.start).toBe('function')
    expect(typeof result.current.stop).toBe('function')
  })
})
