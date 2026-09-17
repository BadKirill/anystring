import { App } from '@capacitor/app'

import { isNativePlatform } from './runtime'

export interface AppVersion {
  version: string
  build: string
}

export function formatAppVersion(appVersion: AppVersion): string {
  return `${appVersion.version} (${appVersion.build})`
}

export function bundledAppVersion(): AppVersion {
  return { version: __APP_VERSION__, build: __APP_BUILD__ }
}

export function pickAppVersion(
  bundled: AppVersion,
  native: AppVersion | null,
): AppVersion {
  if (native === null || native.version === '' || native.build === '') {
    return bundled
  }
  return native
}

export async function readNativeAppVersion(
  read: () => Promise<AppVersion>,
): Promise<AppVersion | null> {
  try {
    return await read()
  } catch {
    return null
  }
}

export async function installedAppVersion(): Promise<AppVersion> {
  const bundled = bundledAppVersion()
  if (!isNativePlatform()) return bundled
  const native = await readNativeAppVersion(readCapacitorAppInfo)
  return pickAppVersion(bundled, native)
}

async function readCapacitorAppInfo(): Promise<AppVersion> {
  const info = await App.getInfo()
  return { version: info.version, build: info.build }
}
