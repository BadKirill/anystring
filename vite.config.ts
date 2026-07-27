import { readFileSync } from 'node:fs'

import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults, defineConfig } from 'vitest/config'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as {
  version: string
}

// Capacitor serves the bundle from capacitor://localhost, where the GitHub
// Pages sub-path is wrong and a service worker only adds stale-asset risk.
const isNativeBuild = process.env.CAP_BUILD === '1'

const pwa = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icon.svg', 'apple-touch-icon.png'],
  manifest: {
    id: '/anystring/',
    name: 'Anystring — custom guitar & bass tuner',
    short_name: 'Anystring',
    description: 'Free tuner for guitar and bass with fully editable per-string tunings.',
    theme_color: '#0d1412',
    background_color: '#0d1412',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      {
        src: 'maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    // The app is fully offline: precache every built asset.
    globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
    skipWaiting: true,
    clientsClaim: true,
  },
})

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/anystring/ on GitHub Pages
  base: isNativeBuild ? './' : '/anystring/',
  define: { __APP_VERSION__: JSON.stringify(version) },
  test: {
    // e2e/ belongs to Playwright, not Vitest
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  plugins: isNativeBuild ? [react()] : [react(), pwa],
})
