/// <reference types="vite/client" />

/** Injected by Vite from the package.json version. */
declare const __APP_VERSION__: string

/** Web Audio Session API (Safari / iOS 17+). */
interface AudioSession {
  type:
    'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record'
}

interface Navigator {
  audioSession?: AudioSession
}
