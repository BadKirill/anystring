import type { ReactNode } from 'react'

import { UI } from './strings'
import { useLockBodyScroll } from './useLockBodyScroll'

interface SheetProps {
  children: ReactNode
  onClose: () => void
  tall?: boolean
}

export function Sheet({ children, onClose, tall }: SheetProps) {
  useLockBodyScroll()

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className={tall ? 'sheet sheet-tall' : 'sheet'}
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="sheet-scroll">{children}</div>
        <div className="sheet-footer">
          <button
            type="button"
            className="button-secondary button-full"
            onClick={onClose}
          >
            {UI.close}
          </button>
        </div>
      </div>
    </div>
  )
}
