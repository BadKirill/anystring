/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __APP_BUILD__: string
declare const __TELEMETRY_APP_ID__: string

interface AudioSession {
  type:
    'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record'
}

interface Navigator {
  audioSession?: AudioSession
}
