import { InAppReview } from '@capacitor-community/in-app-review'

import { isNativePlatform } from './runtime'

export async function requestStoreReview(): Promise<void> {
  if (!isNativePlatform()) {
    return
  }
  try {
    await InAppReview.requestReview()
  } catch {
    return
  }
}
