import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { EDGE_CASES } from './edgeCases'
import {
  MIN_EDGE_CASE_COVERAGE,
  edgeCaseCoverage,
  type EdgeCase,
} from './edgeCaseCoverage'

function covered(id: string): EdgeCase {
  return {
    id,
    area: 'test',
    summary: id,
    testFile: 'src/quality/edgeCases.test.ts',
  }
}

function manual(id: string): EdgeCase {
  return {
    id,
    area: 'test',
    summary: id,
    testFile: null,
    reason: 'fixture',
  }
}

describe('edgeCaseCoverage', () => {
  it('is complete when the catalog is empty', () => {
    expect(edgeCaseCoverage([])).toBe(1)
  })

  it('counts only cases that name a test', () => {
    expect(edgeCaseCoverage([manual('a'), manual('b')])).toBe(0)
    expect(
      edgeCaseCoverage([covered('a'), manual('b'), covered('c'), covered('d')]),
    ).toBe(0.75)
  })

  it('keeps the tuner catalog at or above 80%', () => {
    expect(edgeCaseCoverage(EDGE_CASES)).toBeGreaterThanOrEqual(MIN_EDGE_CASE_COVERAGE)
  })

  it('points every covered case at a test that names its id', () => {
    const ids = new Set<string>()
    for (const entry of EDGE_CASES) {
      expect(ids.has(entry.id)).toBe(false)
      ids.add(entry.id)
      if (entry.testFile === null) {
        expect(entry.reason.trim().length).toBeGreaterThan(0)
        continue
      }
      const source = readFileSync(resolve(entry.testFile), 'utf8')
      expect(source).toContain(entry.id)
    }
  })
})
