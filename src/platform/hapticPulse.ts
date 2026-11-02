import { Haptics, ImpactStyle } from '@capacitor/haptics'

import { isNativePlatform } from './runtime'

const WEB_VIBRATE_MS = 20

function vibrateWeb(): void {
  if (typeof navigator.vibrate !== 'function') {
    return
  }
  navigator.vibrate(WEB_VIBRATE_MS)
}

export function pulseHaptic(): void {
  try {
    if (isNativePlatform()) {
      void Promise.resolve(Haptics.impact({ style: ImpactStyle.Light })).catch(
        () => undefined,
      )
      return
    }
    vibrateWeb()
  } catch {
    return
  }
}
