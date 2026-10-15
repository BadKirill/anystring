import { describe, expect, it } from 'vitest'

import { shouldAutoStart } from './autoStart'

describe('shouldAutoStart', () => {
  it('EC-autostart-idle is true only for an idle session the user has not stopped', () => {
    expect(shouldAutoStart({ status: 'idle', stoppedByUser: false })).toBe(true)
  })

  it('EC-autostart-stopped is false after Stop, even when the status is idle again', () => {
    expect(shouldAutoStart({ status: 'idle', stoppedByUser: true })).toBe(false)
  })

  it('EC-autostart-busy is false while capture is starting or already listening', () => {
    expect(shouldAutoStart({ status: 'starting', stoppedByUser: false })).toBe(false)
    expect(shouldAutoStart({ status: 'listening', stoppedByUser: false })).toBe(false)
    expect(shouldAutoStart({ status: 'listening', stoppedByUser: true })).toBe(false)
  })

  it('EC-autostart-denied is false when the mic is in error', () => {
    expect(shouldAutoStart({ status: 'error', stoppedByUser: false })).toBe(false)
    expect(shouldAutoStart({ status: 'error', stoppedByUser: true })).toBe(false)
  })
})
