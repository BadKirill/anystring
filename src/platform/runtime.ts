import { Capacitor } from '@capacitor/core'

/**
 * True inside the Capacitor iOS/Android shell, false in a browser or PWA.
 * Keeps Capacitor imports out of the UI layer.
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}
