let suppressedUntilMs = 0

export function suppressPitchDetection(durationMs: number): void {
  suppressedUntilMs = Math.max(suppressedUntilMs, performance.now() + durationMs)
}

export function isPitchDetectionSuppressed(): boolean {
  return performance.now() < suppressedUntilMs
}
