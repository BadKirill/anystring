import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TunerGauge } from './TunerGauge'

describe('TunerGauge', () => {
  it('shows an em dash and a muted needle when there is no reading', () => {
    const { container } = render(
      <TunerGauge cents={null} targetLabel={null} inTune={false} />,
    )
    expect(screen.getByText('—')).toBeTruthy()
    const needle = container.querySelector('line[stroke-linecap="round"]')
    expect(needle).not.toBeNull()
    expect(needle?.getAttribute('stroke')).toBe('var(--muted)')
    expect(needle?.outerHTML).toContain('rotate(0deg)')
  })

  it('rotates toward sharp, clamps at ±50 cents, and marks in-tune', () => {
    const { container, rerender } = render(
      <TunerGauge cents={25} targetLabel="E2" inTune={false} />,
    )
    expect(screen.getByText('E2')).toBeTruthy()
    expect(container.querySelector('line[stroke-linecap="round"]')?.outerHTML).toContain(
      'rotate(30deg)',
    )
    rerender(<TunerGauge cents={80} targetLabel="E2" inTune={false} />)
    expect(container.querySelector('line[stroke-linecap="round"]')?.outerHTML).toContain(
      'rotate(60deg)',
    )
    rerender(<TunerGauge cents={0} targetLabel="E2" inTune />)
    expect(container.querySelector('.gauge-note-in-tune')).toBeTruthy()
  })

  it('renders flat and sharp marks in chromatic mode', () => {
    render(<TunerGauge cents={12} targetLabel="A4" inTune={false} chromatic />)
    expect(screen.getByText('♭')).toBeTruthy()
    expect(screen.getByText('#')).toBeTruthy()
  })
})
