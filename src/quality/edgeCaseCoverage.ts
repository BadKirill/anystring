export const MIN_EDGE_CASE_COVERAGE = 0.8

export interface CoveredEdgeCase {
  readonly id: string
  readonly area: string
  readonly summary: string
  readonly testFile: string
}

export interface ManualEdgeCase {
  readonly id: string
  readonly area: string
  readonly summary: string
  readonly testFile: null
  readonly reason: string
}

export type EdgeCase = CoveredEdgeCase | ManualEdgeCase

export function edgeCaseCoverage(cases: readonly EdgeCase[]): number {
  if (cases.length === 0) {
    return 1
  }
  const covered = cases.filter((entry) => entry.testFile !== null).length
  return covered / cases.length
}
