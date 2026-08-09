#!/usr/bin/env bash
# Build Capacitor debug binaries, install on a booted simulator/emulator, run Maestro.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_ID="com.badkirill.anystring"
PLATFORM="${1:-all}" # ios | android | all
MAESTRO_ARGS=("${@:2}")
IOS_SIMULATOR_DEVICE="${IOS_SIMULATOR_DEVICE:-iPhone 17}"
ANDROID_HOME="${ANDROID_HOME:-${HOME}/Library/Android/sdk}"
export PATH="${PATH}:${HOME}/.maestro/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install: curl -Ls https://get.maestro.mobile.dev | bash" >&2
  exit 1
fi

run_maestro() {
  local label="$1"
  echo "==> Maestro ($label)"
  local platform_flag=(-p "$label")
  if ((${#MAESTRO_ARGS[@]} > 0)); then
    maestro test "${platform_flag[@]}" "${MAESTRO_ARGS[@]}"
    return
  fi
  # iOS Simulator cannot reliably deny WKWebView mic — skip deny there.
  if [[ "$label" == "ios" ]]; then
    maestro test "${platform_flag[@]}" \
      .maestro/permissions-allow.yaml \
      .maestro/reference-tap.yaml
  else
    maestro test "${platform_flag[@]}" \
      .maestro/permissions-allow.yaml \
      .maestro/permissions-deny.yaml \
      .maestro/reference-tap.yaml
  fi
}

boot_ios_simulator() {
  local udid
  udid="$(
    xcrun simctl list devices available |
      grep -F "$IOS_SIMULATOR_DEVICE (" |
      grep -E 'Shutdown|Booted' |
      head -n 1 |
      sed -E 's/.*\(([A-F0-9-]{36})\).*/\1/'
  )"
  if [[ -z "$udid" || "$udid" == *"("* ]]; then
    echo "iOS Simulator '$IOS_SIMULATOR_DEVICE' not found. Set IOS_SIMULATOR_DEVICE." >&2
    exit 1
  fi
  if ! xcrun simctl list devices | grep -F "$udid" | grep -q Booted; then
    echo "==> Booting $IOS_SIMULATOR_DEVICE ($udid)" >&2
    xcrun simctl boot "$udid" >/dev/null 2>&1 || true
    xcrun simctl bootstatus "$udid" -b >/dev/null 2>&1
  fi
  # Only the UDID goes to stdout — callers capture it for simctl install.
  printf '%s\n' "$udid"
}

build_ios() {
  echo "==> cap sync + iOS simulator build ($IOS_SIMULATOR_DEVICE)"
  npm run cap:sync
  xcodebuild \
    -project ios/App/App.xcodeproj \
    -scheme App \
    -configuration Debug \
    -destination "platform=iOS Simulator,name=${IOS_SIMULATOR_DEVICE}" \
    -derivedDataPath ios/build \
    build
}

install_ios() {
  local app_path
  app_path="$(find ios/build/Build/Products/Debug-iphonesimulator -name 'App.app' -maxdepth 1 | head -n 1)"
  if [[ -z "$app_path" ]]; then
    echo "iOS App.app not found under ios/build" >&2
    exit 1
  fi
  local booted
  booted="$(boot_ios_simulator)"
  xcrun simctl install "$booted" "$app_path"
  echo "Installed $app_path on $booted"
}

build_android() {
  echo "==> cap sync + Android debug APK"
  npm run cap:sync
  local jbr="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  if [[ -d "$jbr" ]]; then
    export JAVA_HOME="$jbr"
  fi
  (
    cd android
    ./gradlew assembleDebug
  )
}

install_android() {
  local apk="android/app/build/outputs/apk/debug/app-debug.apk"
  if [[ ! -f "$apk" ]]; then
    echo "Debug APK missing: $apk" >&2
    exit 1
  fi
  if ! command -v adb >/dev/null 2>&1; then
    echo "adb not found; install Android platform-tools." >&2
    exit 1
  fi
  if ! adb get-state >/dev/null 2>&1; then
    echo "No Android device/emulator connected via adb." >&2
    exit 1
  fi
  adb install -r "$apk"
  echo "Installed $apk ($APP_ID)"
}

case "$PLATFORM" in
  ios)
    build_ios
    install_ios
    run_maestro ios
    ;;
  android)
    build_android
    install_android
    run_maestro android
    ;;
  all)
    build_ios
    install_ios
    run_maestro ios
    build_android
    install_android
    run_maestro android
    ;;
  *)
    echo "Usage: $0 [ios|android|all] [extra maestro test args...]" >&2
    exit 1
    ;;
esac

echo "==> Native e2e finished ($PLATFORM)"
