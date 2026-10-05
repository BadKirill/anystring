export const PRIVACY_POLICY_VERSION = '2026-10-05'

const ACCEPTED_KEY = 'anystring.v2.privacyAccepted'

export function needsPrivacyNotice(accepted: string | null): boolean {
  return accepted !== PRIVACY_POLICY_VERSION
}

export function readPrivacyAccepted(): string | null {
  const stored = localStorage.getItem(ACCEPTED_KEY)
  return stored === null || stored === '' ? null : stored
}

export function acceptPrivacyNotice(): boolean {
  try {
    localStorage.setItem(ACCEPTED_KEY, PRIVACY_POLICY_VERSION)
    return true
  } catch {
    return false
  }
}
