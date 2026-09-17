import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseReleaseVersion, stampIosPbxproj } from './appReleaseVersion.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const release = parseReleaseVersion(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const pbxPath = join(ROOT, 'ios/App/App.xcodeproj/project.pbxproj')
writeFileSync(pbxPath, stampIosPbxproj(readFileSync(pbxPath, 'utf8'), release))
