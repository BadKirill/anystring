# Native shell (iOS / Android)

Tags: `capacitor`, `ios`, `android`, `native`, `store`, `permissions`, `privacy`  
Paths: `capacitor.config.ts`, `ios/`, `android/`, `src/platform/`, `public/privacy.html`

## Role

Ship the same Vite bundle to the App Store and Google Play. Capacitor 8 wraps
`dist/` in a native binary; there is no second codebase and no native UI.

## Build pipeline

| Command                | Effect                                               |
| ---------------------- | ---------------------------------------------------- |
| `npm run build`        | Web/PWA build: `base: '/anystring/'`, service worker |
| `npm run build:native` | `CAP_BUILD=1`: `base: './'`, **no** service worker   |
| `npm run cap:sync`     | Native build + `cap sync` into `ios/` and `android/` |
| `npm run cap:ios`      | Sync, then open Xcode                                |
| `npm run cap:android`  | Sync, then open Android Studio                       |

`CAP_BUILD` matters because the shell serves from `capacitor://localhost`: the
Pages sub-path would 404 and a service worker only adds stale-asset risk.

## Toolchain

- Node **22+** (Capacitor 8 requirement, `engines.node`).
- Xcode 26+ for App Store uploads; iOS project uses Swift Package Manager, no CocoaPods.
- Android CLI builds need **JDK 21**; the system JDK 17 fails with
  `invalid source release: 21`. Use Android Studio's bundled runtime:
  `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew assembleDebug`.

## Platform configuration

| Concern        | iOS                                                                      | Android                                                        |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Mic permission | `NSMicrophoneUsageDescription` in `Info.plist`                           | `RECORD_AUDIO` + `android.hardware.microphone`                 |
| Orientation    | portrait only, `UIRequiresFullScreen`                                    | `android:screenOrientation="portrait"`                         |
| Privacy        | `App/App/PrivacyInfo.xcprivacy` (no data collected, UserDefaults CA92.1) | Data Safety form in Play Console                               |
| Encryption     | `ITSAppUsesNonExemptEncryption = false`                                  | n/a                                                            |
| SDK target     | deployment target 15.0                                                   | `targetSdkVersion 36` (required for new apps from 31 Aug 2026) |

Version numbers: `package.json` `version` is the single source; Vite injects it as
`__APP_VERSION__` for the About sheet. Keep `MARKETING_VERSION` (iOS) and
`versionName` (Android) in step when bumping.

## Icons and splash

`node scripts/generate-icons.mjs` renders everything from `public/icon.svg`:
PWA icons, the iOS asset catalog (1024 icon, 2732 splash), and the Android
launcher/round/adaptive-foreground mipmaps plus splash densities. It reuses the
sizes already present, so run it after `cap add` overwrites placeholders. The
store icon drops the SVG corner radius because both platforms mask their own.

## Runtime seam

`src/platform/runtime.ts` exposes `isNativePlatform()`; only that module imports
Capacitor. The PWA install hint is hidden when it returns true.

## iOS microphone risk (open)

WebKit bug 230902: a `getUserMedia` stream inside `WKWebView` can deliver silent
samples to the Web Audio graph while iOS is capturing. Safari is unaffected, so
the PWA works and only the shell is unknown. This must be checked on a real
iPhone — the simulator does not reproduce the bug either way.

1. `npm run cap:ios`, set a signing team, run on a connected iPhone.
2. Start tuning in the app, then attach Safari on the Mac:
   Develop → iPhone → App, and run in the console:

```js
const stream = await navigator.mediaDevices.getUserMedia({
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
})
const ctx = new AudioContext()
const analyser = ctx.createAnalyser()
ctx.createMediaStreamSource(stream).connect(analyser)
const buf = new Float32Array(analyser.fftSize)
setInterval(() => {
  analyser.getFloatTimeDomainData(buf)
  console.log(Math.max(...Array.from(buf, Math.abs)))
}, 500)
```

Non-zero peaks while playing a string mean the web mic path is fine and nothing
else is needed. All zeros mean the bug is present: add `src/audio/micSource.ts`
selecting an `AVAudioEngine` plugin that posts 8192-sample Float32 windows.
`detectPitch` and everything above it stay unchanged either way.

## Store answers (both consoles)

- Apple App Privacy and Google Data Safety: **no data collected**, no tracking,
  no third-party sharing. Microphone audio is processed on-device and discarded.
- Age rating: no objectionable content, ages 4+ / Everyone.
- Privacy policy URL: `https://badkirill.github.io/anystring/privacy.html`
  (source: `public/privacy.html`). Support URL: the repo issues page.
- Guideline 4.2 (minimum functionality): assets are bundled locally, the app runs
  fully offline with native icon and splash, and real-time pitch DSP is the
  substantive feature — say so in the review notes.

## Open when

Adding a Capacitor plugin, changing permissions or store metadata, bumping SDK
targets or app version, regenerating icons, or debugging native-only audio.

## See also

- [audio.md](audio.md) — the mic path the shell reuses
- [tooling.md](tooling.md) — Vite config and npm scripts
- [ci-cd.md](ci-cd.md) — web deploy; native builds are manual
