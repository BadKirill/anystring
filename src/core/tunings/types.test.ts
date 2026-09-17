import { describe, expect, it } from 'vitest'

import { isInstrument, INSTRUMENTS } from './types'

describe('isInstrument', () => {
  it('accepts the supported instruments and rejects unknown names', () => {
    expect(INSTRUMENTS).toEqual(['guitar', 'bass', 'ukulele'])
    expect(isInstrument('guitar')).toBe(true)
    expect(isInstrument('bass')).toBe(true)
    expect(isInstrument('ukulele')).toBe(true)
    expect(isInstrument('banjo')).toBe(false)
    expect(isInstrument(1)).toBe(false)
  })
})
