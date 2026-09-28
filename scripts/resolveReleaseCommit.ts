import { execFileSync } from 'node:child_process'

import { storeReleaseSha, type ReleaseCommit } from './appReleaseVersion.ts'

function git(args: readonly string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function childCommits(base: string): ReleaseCommit[] {
  const log = git([
    'log',
    '--first-parent',
    '--ancestry-path',
    '--reverse',
    '--format=%H %s',
    `${base}..origin/master`,
  ])
  if (log.length === 0) return []
  return log.split('\n').map((line) => {
    const space = line.indexOf(' ')
    return { sha: line.slice(0, space), subject: line.slice(space + 1) }
  })
}

const base = process.argv.slice(2).at(0)
if (base === undefined || base.length === 0) {
  console.error('usage: resolveReleaseCommit.ts <sha>')
  process.exit(1)
}

const sha = git(['rev-parse', '--verify', base])
const release = storeReleaseSha(
  { sha, subject: git(['log', '-1', '--format=%s', sha]) },
  childCommits(sha),
)
if (release !== undefined) console.log(release)
