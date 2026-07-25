import { useState } from 'react'

import { UI } from './strings'

const DISMISSED_KEY = 'anystring.installHintDismissed'

function shouldShow(): boolean {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  return isIos && !isStandalone && localStorage.getItem(DISMISSED_KEY) === null
}

/** Tells iOS Safari users how to install the PWA (no automatic prompt on iOS). */
export function InstallHint() {
  const [visible, setVisible] = useState(shouldShow)

  if (!visible) {
    return null
  }
  return (
    <div className="install-hint">
      <span>{UI.installHint}</span>
      <button
        type="button"
        className="button-secondary"
        onClick={() => {
          localStorage.setItem(DISMISSED_KEY, '1')
          setVisible(false)
        }}
      >
        {UI.close}
      </button>
    </div>
  )
}
