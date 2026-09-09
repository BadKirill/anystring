import { useLayoutEffect } from 'react'

import { playReferencePitch, warmReferenceAudio } from '../audio/referenceTone'
import { formatPitch, pitchToMidi, type Pitch } from '../core/music'
import type { Tuning } from '../core/tunings'
import type { StringRailOverflow } from './stringRailOverflow'
import { UI } from './strings'
import { useStringRailScroll } from './useStringRailScroll'

function stringThickness(pitch: Pitch): number {
  const midi = pitchToMidi(pitch)
  const E4_MIDI = 64
  return Math.min(6.5, Math.max(1, (E4_MIDI - midi) * 0.14 + 1))
}

function StringGauge({ pitch, active }: { pitch: Pitch; active: boolean }) {
  const thickness = stringThickness(pitch)
  return (
    <svg className="string-gauge" viewBox="0 0 12 72" aria-hidden="true">
      <circle cx="6" cy="4" r="1.8" fill="currentColor" opacity={active ? 0.9 : 0.5} />
      <line
        x1="6"
        y1="4"
        x2="6"
        y2="68"
        stroke="currentColor"
        strokeWidth={thickness}
        strokeLinecap="round"
        opacity={active ? 1 : 0.75}
      />
      <circle cx="6" cy="68" r="1.8" fill="currentColor" opacity={active ? 0.9 : 0.5} />
    </svg>
  )
}

interface StringListProps {
  tuning: Tuning

  activeIndex: number | null

  manualIndex: number | null
  onSelect: (index: number | null) => void
  onEdit: (index: number) => void
}

function tapString(
  index: number,
  pitch: Pitch,
  manualIndex: number | null,
  onSelect: (index: number | null) => void,
  onEdit: (index: number) => void,
): void {
  void warmReferenceAudio().then(() => playReferencePitch(pitch))
  if (manualIndex === index) {
    onEdit(index)
  } else {
    onSelect(index)
  }
}

function revealActiveString(
  root: HTMLDivElement | null,
  activeIndex: number | null,
): void {
  if (root === null || activeIndex === null) {
    return
  }
  const item = root.children.item(activeIndex)
  if (item instanceof HTMLElement) {
    item.scrollIntoView({ inline: 'nearest', block: 'nearest' })
  }
}

function StringItem({
  index,
  pitch,
  active,
  manual,
  onTap,
}: {
  index: number
  pitch: Pitch
  active: boolean
  manual: boolean
  onTap: () => void
}) {
  const classes = [
    'string-button',
    active ? 'string-active' : '',
    manual ? 'string-manual' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className="string-item">
      <StringGauge pitch={pitch} active={active} />
      <button type="button" className={classes} onClick={onTap}>
        <span className="string-number">{index + 1}</span>
        <span className="string-note">{formatPitch(pitch)}</span>
      </button>
    </div>
  )
}

function StringRailChrome({
  overflow,
  scrollLeft,
  onScrollLeft,
}: {
  overflow: StringRailOverflow
  scrollLeft: number
  onScrollLeft: (left: number) => void
}) {
  if (!overflow.hasOverflow) {
    return null
  }
  return (
    <input
      type="range"
      className="string-rail-slider"
      min={0}
      max={overflow.maxScroll}
      value={scrollLeft}
      aria-label={UI.scrollStrings}
      onChange={(event) => {
        onScrollLeft(Number(event.target.value))
      }}
    />
  )
}

export function StringList({
  tuning,
  activeIndex,
  manualIndex,
  onSelect,
  onEdit,
}: StringListProps) {
  const rail = useStringRailScroll(tuning.strings.length)
  useLayoutEffect(() => {
    revealActiveString(rail.ref.current, activeIndex)
  }, [activeIndex, rail.ref])

  const listClass = rail.overflow.hasOverflow
    ? 'string-list string-list-overflow'
    : 'string-list'

  return (
    <div className="string-rail">
      <div ref={rail.ref} className={listClass} onScroll={rail.onScroll}>
        {tuning.strings.map((string, index) => (
          <StringItem
            key={index}
            index={index}
            pitch={string.pitch}
            active={index === activeIndex}
            manual={index === manualIndex}
            onTap={() => {
              tapString(index, string.pitch, manualIndex, onSelect, onEdit)
            }}
          />
        ))}
      </div>
      <StringRailChrome
        overflow={rail.overflow}
        scrollLeft={rail.metrics.scrollLeft}
        onScrollLeft={rail.setScrollLeft}
      />
    </div>
  )
}
