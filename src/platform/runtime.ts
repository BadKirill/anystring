import { Capacitor } from '@capacitor/core'

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

export function analyticsPlatform(): 'web' | 'ios' | 'android' {
  if (!isNativePlatform()) {
    return 'web'
  }
  const platform = Capacitor.getPlatform()
  return platform === 'ios' || platform === 'android' ? platform : 'web'
}
