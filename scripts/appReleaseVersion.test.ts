import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  androidUsesPackageJson,
  bumpReleaseVersion,
  iosBuildNumbers,
  iosMarketingVersions,
  iphoneOnlyErrors,
  isVersionBumpCommit,
  parseReleaseVersion,
  releaseCommitAfter,
  releaseVersionErrors,
  stampIosPbxproj,
  storeReleaseSha,
  VERSION_BUMP_COMMIT_PREFIX,
  versionBumpCommitMessage,
} from './appReleaseVersion.ts'

const PBX = `
  CURRENT_PROJECT_VERSION = 1;
  MARKETING_VERSION = 1.0.0;
  CURRENT_PROJECT_VERSION = 1;
  MARKETING_VERSION = 1.0.0;
`

describe('parseReleaseVersion', () => {
  it('reads version and buildNumber from package.json', () => {
    expect(
      parseReleaseVersion('{"name":"anystring","version":"1.0.3","buildNumber":8}'),
    ).toEqual({ version: '1.0.3', buildNumber: 8 })
  })

  it('rejects a missing buildNumber', () => {
    expect(() => parseReleaseVersion('{"version":"1.0.3"}')).toThrow(
      'package.json is missing a positive integer buildNumber',
    )
  })
})

describe('bumpReleaseVersion', () => {
  const current = { version: '1.0.3', buildNumber: 8 }

  it('increments patch and the store build number', () => {
    expect(bumpReleaseVersion(current, 'patch')).toEqual({
      version: '1.0.4',
      buildNumber: 9,
    })
  })

  it('increments minor and the store build number', () => {
    expect(bumpReleaseVersion(current, 'minor')).toEqual({
      version: '1.1.0',
      buildNumber: 9,
    })
  })

  it('increments major and the store build number', () => {
    expect(bumpReleaseVersion(current, 'major')).toEqual({
      version: '2.0.0',
      buildNumber: 9,
    })
  })

  it('keeps the marketing version when only the store build is bumped', () => {
    expect(bumpReleaseVersion(current, 'build')).toEqual({
      version: '1.0.3',
      buildNumber: 9,
    })
  })
})

describe('iphoneOnlyErrors', () => {
  it('accepts a single iPhone device family', () => {
    expect(iphoneOnlyErrors('TARGETED_DEVICE_FAMILY = 1;', '<plist></plist>')).toEqual([])
  })

  it('rejects iPad and a missing family', () => {
    expect(
      iphoneOnlyErrors('TARGETED_DEVICE_FAMILY = "1,2";', '<plist></plist>'),
    ).toEqual(['TARGETED_DEVICE_FAMILY "1,2" !== 1'])
    expect(
      iphoneOnlyErrors(
        'TARGETED_DEVICE_FAMILY = 1;',
        '<key>UISupportedInterfaceOrientations~ipad</key>',
      ),
    ).toEqual(['Info.plist still declares iPad orientations'])
    expect(iphoneOnlyErrors('', '')).toEqual(['TARGETED_DEVICE_FAMILY missing'])
  })
})

describe('version bump commits', () => {
  it('names the marketing version and build number', () => {
    expect(versionBumpCommitMessage({ version: '1.1.1', buildNumber: 10 })).toBe(
      'Bump version to 1.1.1 (10).',
    )
  })

  it('recognizes only the generated subject line', () => {
    const message = versionBumpCommitMessage({ version: '1.1.1', buildNumber: 10 })
    expect(isVersionBumpCommit(message)).toBe(true)
    expect(isVersionBumpCommit(`${message}\n\nbody`)).toBe(true)
    expect(
      isVersionBumpCommit(
        'Merge pull request #54 from BadKirill/feat/edge-case-coverage',
      ),
    ).toBe(false)
  })
})

describe('releaseCommitAfter', () => {
  const bump = {
    sha: 'abc123',
    subject: versionBumpCommitMessage({ version: '1.1.2', buildNumber: 11 }),
  }

  it('EC-release-empty waits while the bump commit is not on master yet', () => {
    expect(releaseCommitAfter([])).toBeUndefined()
  })

  it('EC-release-bump returns the first child when it is the version bump', () => {
    expect(releaseCommitAfter([bump])).toBe('abc123')
  })

  it('EC-release-skipped returns nothing when the first child is not a bump', () => {
    expect(
      releaseCommitAfter([{ sha: 'def456', subject: 'Fix the gauge' }]),
    ).toBeUndefined()
  })

  it('EC-release-first ignores later children and uses only the first', () => {
    expect(
      releaseCommitAfter([{ sha: 'def456', subject: 'Fix the gauge' }, bump]),
    ).toBeUndefined()
    expect(releaseCommitAfter([bump, { sha: 'def456', subject: 'Fix the gauge' }])).toBe(
      'abc123',
    )
  })
})

describe('storeReleaseSha', () => {
  const bumpSubject = versionBumpCommitMessage({ version: '1.1.2', buildNumber: 11 })

  it('EC-release-head uploads the commit itself when that commit is the version bump', () => {
    expect(
      storeReleaseSha({ sha: 'abc123', subject: bumpSubject }, [
        { sha: 'def456', subject: 'Fix the gauge' },
      ]),
    ).toBe('abc123')
  })

  it('uploads the bump child of a CI commit', () => {
    expect(
      storeReleaseSha({ sha: 'parent', subject: 'Merge pull request #60' }, [
        { sha: 'abc123', subject: bumpSubject },
      ]),
    ).toBe('abc123')
  })
})

describe('stampIosPbxproj', () => {
  it('writes MARKETING_VERSION and CURRENT_PROJECT_VERSION from the release', () => {
    const stamped = stampIosPbxproj(PBX, { version: '1.0.3', buildNumber: 8 })
    expect(iosMarketingVersions(stamped)).toEqual(['1.0.3', '1.0.3'])
    expect(iosBuildNumbers(stamped)).toEqual(['8', '8'])
  })
})

describe('androidUsesPackageJson', () => {
  it('is true when Gradle reads versionName and versionCode from package.json', () => {
    expect(
      androidUsesPackageJson(`
        def appPkg = new groovy.json.JsonSlurper().parse(rootProject.file("../package.json"))
        versionCode appPkg.buildNumber
        versionName appPkg.version
      `),
    ).toBe(true)
  })

  it('is false when Android still has literal store versions', () => {
    expect(
      androidUsesPackageJson(`
        versionCode 4
        versionName "1.0.0"
      `),
    ).toBe(false)
  })
})

describe('releaseVersionErrors', () => {
  const release = { version: '1.0.3', buildNumber: 8 }

  it('is empty when iOS matches and Android reads package.json', () => {
    expect(
      releaseVersionErrors({
        release,
        gradle: `
          def appPkg = new groovy.json.JsonSlurper().parse(rootProject.file("../package.json"))
          versionCode appPkg.buildNumber
          versionName appPkg.version
        `,
        pbxproj: stampIosPbxproj(PBX, release),
      }),
    ).toEqual([])
  })

  it('reports a stale iOS marketing version', () => {
    expect(
      releaseVersionErrors({
        release,
        gradle: `
          def appPkg = new groovy.json.JsonSlurper().parse(rootProject.file("../package.json"))
          versionCode appPkg.buildNumber
          versionName appPkg.version
        `,
        pbxproj: PBX,
      }),
    ).toContain('iOS MARKETING_VERSION 1.0.0 !== 1.0.3')
  })
})

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('repo release versions', () => {
  it('uses the bump prefix so the master workflow does not bump its own commit', () => {
    const bump = readFileSync(join(ROOT, '.github/workflows/version-bump.yml'), 'utf8')
    expect(bump).toContain(VERSION_BUMP_COMMIT_PREFIX)
    expect(bump).toContain('isVersionBumpCommit')
  })

  it('targets iPhone only so App Store does not require iPad screenshots', () => {
    const pbxproj = readFileSync(
      join(ROOT, 'ios/App/App.xcodeproj/project.pbxproj'),
      'utf8',
    )
    const infoPlist = readFileSync(join(ROOT, 'ios/App/App/Info.plist'), 'utf8')
    expect(iphoneOnlyErrors(pbxproj, infoPlist)).toEqual([])
  })

  it('uploads that bump commit to TestFlight and Play internal after CI', () => {
    const workflow = readFileSync(
      join(ROOT, '.github/workflows/store-release.yml'),
      'utf8',
    )
    const exportOptions = readFileSync(join(ROOT, 'ios/App/ExportOptions.plist'), 'utf8')
    expect(workflow).toContain('workflows: [CI]')
    expect(workflow).toContain('resolveReleaseCommit.ts')
    expect(workflow).toContain('tracks: internal')
    expect(workflow).toContain('macos-26')
    expect(workflow).toContain('TARGETED_DEVICE_FAMILY=1')
    expect(exportOptions).toContain('<string>upload</string>')
    expect(exportOptions).toContain('<string>app-store-connect</string>')
    expect(exportOptions).toContain('<string>manual</string>')
  })

  it('keeps iOS metadata and Android Gradle in step with package.json', () => {
    const release = parseReleaseVersion(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    expect(
      releaseVersionErrors({
        release,
        gradle: readFileSync(join(ROOT, 'android/app/build.gradle'), 'utf8'),
        pbxproj: readFileSync(
          join(ROOT, 'ios/App/App.xcodeproj/project.pbxproj'),
          'utf8',
        ),
      }),
    ).toEqual([])
  })
})
