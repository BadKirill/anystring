import { useState } from 'react'

import { isNativePlatform } from '../platform/runtime'
import { UI } from './strings'

const DISMISSED_KEY = 'anystring.installHintDismissed'

function shouldShow(): boolean {
  if (isNativePlatform()) {
    return false
  }
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  return isIos && !isStandalone && localStorage.getItem(DISMISSED_KEY) === null
}

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
