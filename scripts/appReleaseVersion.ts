export interface ReleaseVersion {
  version: string
  buildNumber: number
}

export type VersionBump = 'major' | 'minor' | 'patch' | 'build'

function packageFields(packageJsonText: string): {
  version: unknown
  buildNumber: unknown
} {
  const parsed: unknown = JSON.parse(packageJsonText)
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('package.json is missing a string version')
  }
  return {
    version: 'version' in parsed ? parsed.version : undefined,
    buildNumber: 'buildNumber' in parsed ? parsed.buildNumber : undefined,
  }
}

export function parseReleaseVersion(packageJsonText: string): ReleaseVersion {
  const fields = packageFields(packageJsonText)
  if (typeof fields.version !== 'string' || fields.version.length === 0) {
    throw new Error('package.json is missing a string version')
  }
  if (
    typeof fields.buildNumber !== 'number' ||
    !Number.isInteger(fields.buildNumber) ||
    fields.buildNumber < 1
  ) {
    throw new Error('package.json is missing a positive integer buildNumber')
  }
  return { version: fields.version, buildNumber: fields.buildNumber }
}

function semverParts(version: string): [number, number, number] {
  const parts = version.split('.').map((part) => Number(part))
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    throw new Error(`invalid marketing version ${version}`)
  }
  return [parts[0], parts[1], parts[2]]
}

function marketingVersion(major: number, minor: number, patch: number): string {
  return `${String(major)}.${String(minor)}.${String(patch)}`
}

export function bumpReleaseVersion(
  current: ReleaseVersion,
  bump: VersionBump,
): ReleaseVersion {
  const buildNumber = current.buildNumber + 1
  const [major, minor, patch] = semverParts(current.version)
  if (bump === 'build') return { version: current.version, buildNumber }
  if (bump === 'patch')
    return { version: marketingVersion(major, minor, patch + 1), buildNumber }
  if (bump === 'minor')
    return { version: marketingVersion(major, minor + 1, 0), buildNumber }
  return { version: marketingVersion(major + 1, 0, 0), buildNumber }
}

export function iosMarketingVersions(pbxproj: string): string[] {
  return [...pbxproj.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((match) => match[1])
}

export function iosBuildNumbers(pbxproj: string): string[] {
  return [...pbxproj.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)].map(
    (match) => match[1],
  )
}

export function stampIosPbxproj(pbxproj: string, release: ReleaseVersion): string {
  return pbxproj
    .replaceAll(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${release.version};`)
    .replaceAll(
      /CURRENT_PROJECT_VERSION = [^;]+;/g,
      `CURRENT_PROJECT_VERSION = ${String(release.buildNumber)};`,
    )
}

export function androidUsesPackageJson(gradle: string): boolean {
  return (
    gradle.includes('rootProject.file("../package.json")') &&
    /\bversionName\s+appPkg\.version\b/.test(gradle) &&
    /\bversionCode\s+appPkg\.buildNumber\b/.test(gradle)
  )
}

function uniqueMismatches(values: string[], expected: string, label: string): string[] {
  if (values.length === 0) return [`${label} missing`]
  return [...new Set(values.filter((value) => value !== expected))].map(
    (value) => `${label} ${value} !== ${expected}`,
  )
}

export function releaseVersionErrors(input: {
  release: ReleaseVersion
  gradle: string
  pbxproj: string
}): string[] {
  const android = androidUsesPackageJson(input.gradle)
    ? []
    : ['Android Gradle does not read versionName/versionCode from package.json']
  return [
    ...android,
    ...uniqueMismatches(
      iosMarketingVersions(input.pbxproj),
      input.release.version,
      'iOS MARKETING_VERSION',
    ),
    ...uniqueMismatches(
      iosBuildNumbers(input.pbxproj),
      String(input.release.buildNumber),
      'iOS CURRENT_PROJECT_VERSION',
    ),
  ]
}
