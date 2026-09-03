import { useRef, useState, type TouchEvent } from 'react'

const ACTION_WIDTH = 72
const SNAP_THRESHOLD = 36

type RevealedAction = 'none' | 'delete' | 'edit'

function snapOffset(
  value: number,
  hasDelete: boolean,
  hasEdit: boolean,
): { offset: number; action: RevealedAction } {
  if (value <= -SNAP_THRESHOLD && hasDelete) {
    return { offset: -ACTION_WIDTH, action: 'delete' }
  }
  if (value >= SNAP_THRESHOLD && hasEdit) {
    return { offset: ACTION_WIDTH, action: 'edit' }
  }
  return { offset: 0, action: 'none' }
}

function clampOffset(value: number, hasDelete: boolean, hasEdit: boolean): number {
  const maxRight = hasEdit ? ACTION_WIDTH : 0
  const maxLeft = hasDelete ? -ACTION_WIDTH : 0
  return Math.min(maxRight, Math.max(maxLeft, value))
}

export function useSwipeOffset(hasDelete: boolean, hasEdit: boolean) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(0)
  const startOffset = useRef(0)

  const onTouchStart = (event: TouchEvent) => {
    startX.current = event.touches[0]?.clientX ?? 0
    startOffset.current = offset
  }

  const onTouchMove = (event: TouchEvent) => {
    const currentX = event.touches[0]?.clientX ?? 0
    const delta = currentX - startX.current
    setOffset(clampOffset(startOffset.current + delta, hasDelete, hasEdit))
  }

  const onTouchEnd = () => {
    setOffset(snapOffset(offset, hasDelete, hasEdit).offset)
  }

  const reset = () => {
    setOffset(0)
  }

  return { offset, onTouchStart, onTouchMove, onTouchEnd, reset }
}
