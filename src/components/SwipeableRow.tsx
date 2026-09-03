import type { ReactNode } from 'react'

import { useSwipeOffset } from './useSwipeOffset'

interface SwipeableRowProps {
  children: ReactNode
  onDelete?: () => void
  onEdit?: () => void
}

export function SwipeableRow({ children, onDelete, onEdit }: SwipeableRowProps) {
  const { offset, onTouchStart, onTouchMove, onTouchEnd, reset } = useSwipeOffset(
    !!onDelete,
    !!onEdit,
  )

  return (
    <div className="swipe-row">
      {onEdit && (
        <button
          type="button"
          className="swipe-action swipe-action-edit"
          aria-label="Edit"
          onClick={() => {
            onEdit()
            reset()
          }}
        >
          ✎
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="swipe-action swipe-action-delete"
          aria-label="Delete"
          onClick={() => {
            onDelete()
            reset()
          }}
        >
          ×
        </button>
      )}
      <div
        className="swipe-row-content"
        style={{ transform: `translateX(${String(offset)}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
