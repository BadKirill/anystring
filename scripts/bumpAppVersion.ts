import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  bumpReleaseVersion,
  parseReleaseVersion,
  stampIosPbxproj,
  type VersionBump,
} from './appReleaseVersion.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const bump = process.argv[2]
const allowed: VersionBump[] = ['major', 'minor', 'patch', 'build']

if (bump !== 'major' && bump !== 'minor' && bump !== 'patch' && bump !== 'build') {
  console.error(`usage: bumpAppVersion.ts ${allowed.join('|')}`)
  process.exit(1)
}

const packagePath = join(ROOT, 'package.json')
const packageText = readFileSync(packagePath, 'utf8')
const next = bumpReleaseVersion(parseReleaseVersion(packageText), bump)
const parsed: unknown = JSON.parse(packageText)
if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
  throw new Error('package.json is not an object')
}

writeFileSync(
  packagePath,
  `${JSON.stringify({ ...parsed, version: next.version, buildNumber: next.buildNumber }, null, 2)}\n`,
)

const pbxPath = join(ROOT, 'ios/App/App.xcodeproj/project.pbxproj')
writeFileSync(pbxPath, stampIosPbxproj(readFileSync(pbxPath, 'utf8'), next))
console.log(`version ${next.version} (${String(next.buildNumber)})`)
