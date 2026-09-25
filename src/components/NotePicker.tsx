import { useState } from 'react'

import { playReferencePitch } from '../audio/referenceTone'
import {
  MAX_OCTAVE,
  MIN_OCTAVE,
  NOTE_NAMES,
  type NoteName,
  type Pitch,
} from '../core/music'
import { Sheet } from './Sheet'
import { UI } from './strings'

const OCTAVES = Array.from(
  { length: MAX_OCTAVE - MIN_OCTAVE + 1 },
  (_, index) => MIN_OCTAVE + index,
)

function preview(pitch: Pitch): void {
  playReferencePitch(pitch).catch(() => undefined)
}

interface NotePickerProps {
  initial: Pitch
  onConfirm: (pitch: Pitch) => void
  onClose: () => void
}

function ChipGrid<T extends string | number>({
  values,
  selected,
  onPick,
}: {
  values: readonly T[]
  selected: T
  onPick: (value: T) => void
}) {
  return (
    <div className="note-grid">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          className={value === selected ? 'chip chip-selected' : 'chip'}
          onClick={() => {
            onPick(value)
          }}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

export function NotePicker({ initial, onConfirm, onClose }: NotePickerProps) {
  const [note, setNote] = useState<NoteName>(initial.note)
  const [octave, setOctave] = useState<number>(initial.octave)

  const pickNote = (next: NoteName) => {
    setNote(next)
    preview({ note: next, octave })
  }
  const pickOctave = (next: number) => {
    setOctave(next)
    preview({ note, octave: next })
  }

  return (
    <Sheet onClose={onClose}>
      <h2>{UI.pickNote}</h2>
      <ChipGrid values={NOTE_NAMES} selected={note} onPick={pickNote} />
      <h3>{UI.octave}</h3>
      <ChipGrid values={OCTAVES} selected={octave} onPick={pickOctave} />
      <div className="sheet-actions">
        <button
          type="button"
          className="button-primary button-full"
          onClick={() => {
            onConfirm({ note, octave })
          }}
        >
          {UI.done}
        </button>
      </div>
    </Sheet>
  )
}
