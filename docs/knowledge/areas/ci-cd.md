# CI/CD

Tags: `ci`, `deploy`, `pages`, `github-actions`  
Docs: `docs/CI.md` · Workflows: `.github/workflows/`

## CI (`ci.yml`) — every push/PR

Separate GitHub checks:

1. Lint — `npm run lint`
2. Format — `npm run format:check`
3. Typecheck — `npm run typecheck`
4. Unit tests — `npm run test` (Vitest + 95% coverage + edge-case coverage ≥ 80%)
5. Knowledge graph — `npm run knowledge:check` (local snapshot only)
6. E2E local — `npm run test:e2e`

External Wiki sync is **not** run on push/PR. Manual
`workflow_dispatch` only (`.github/workflows/knowledge-wiki.yml`).

## Version bump (`version-bump.yml`) — push to `master`

Runs `npm run version:patch` (marketing patch + `buildNumber`) and pushes
`Bump version to x.y.z (n).` back to `master`. That commit does not bump again.
Store builds taken from `master` after this job show the new version in About.
The workflow token must be allowed to push to `master`.

## Store release (`store-release.yml`) — after CI succeeds on `master`

The bump commit is pushed with `GITHUB_TOKEN`, so it does not start workflows
itself. This workflow runs on `workflow_run` when **CI** completes successfully
on `master`. It polls (up to 5 minutes) for the first-parent child of the CI
commit and uploads **only when that child is a version bump**. If the next
commit on `master` is not that bump, the upload is skipped. A manual
`workflow_dispatch` re-uploads a bump commit (`sha` defaults to `master`).

| Job           | What it uploads                                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| TestFlight    | `xcodebuild` archive on `macos-26` with `TARGETED_DEVICE_FAMILY=1`, then `exportArchive` with `destination: upload` |
| Play internal | `gradlew bundleRelease`, then Play track `internal` (`status: completed`)                                           |

No Fastlane. Signing material is repository secrets, written into the runner
and deleted at the end. Android reuses `android/keystore.properties` (gitignored).
iOS signing is manual via `ios/App/ExportOptions.plist` (`teamID` and the
profile name are filled on the runner).

| Secret                            | Use                                                      |
| --------------------------------- | -------------------------------------------------------- |
| `APPLE_TEAM_ID`                   | Apple Developer team                                     |
| `IOS_DIST_CERT_P12_BASE64`        | Apple Distribution certificate (`.p12`, base64)          |
| `IOS_DIST_CERT_PASSWORD`          | Password for that `.p12`                                 |
| `IOS_PROVISIONING_PROFILE_BASE64` | App Store profile for `com.badkirill.anystring`          |
| `ASC_KEY_ID` / `ASC_ISSUER_ID`    | App Store Connect API key                                |
| `ASC_PRIVATE_KEY`                 | API key `.p8` contents (App Manager)                     |
| `ANDROID_KEYSTORE_BASE64`         | Upload keystore (`android/upload-keystore.jks`)          |
| `ANDROID_KEYSTORE_PASSWORD`       | Keystore password                                        |
| `ANDROID_KEY_ALIAS`               | Key alias                                                |
| `ANDROID_KEY_PASSWORD`            | Key password                                             |
| `PLAY_SERVICE_ACCOUNT_JSON`       | Play Console service account (release to testing tracks) |

One-time in the consoles: a TestFlight internal group, and the Play service
account invited with release-to-testing permission. The first AAB was uploaded
by hand, so the Play Developer API accepts later uploads.

## Deploy (`deploy.yml`) — push to `master`

1. Build Vite → Pages artifact (`base: /`, landing + `/app` tuner)
2. Deploy GitHub Pages → https://anystring.app/
3. Live UI smoke — `npm run test:e2e:live`

## Agent notes

- Do not merge with failing CI checks.
- After structural changes: update **local** `docs/knowledge/` + `knowledge:check`.
- Notion / GitHub Wiki: only on explicit user request, then read-back.
- No commit/PR automation for external wikis.

## Open when

Changing workflows, Node version, Pages base path, or check matrix.

## See also

- [testing.md](testing.md) · [tooling.md](tooling.md) · [native-shell.md](native-shell.md)
