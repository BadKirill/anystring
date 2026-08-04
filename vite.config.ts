import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults, defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as {
  version: string
}

// Capacitor serves from capacitor://localhost: relative base, no service worker.
// Native uses `root: app` so the shell lands at dist/index.html (not dist/app/).
const isNativeBuild = process.env.CAP_BUILD === '1'

const pwa = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icon.svg', 'apple-touch-icon.png'],
  manifest: {
    id: '/app/',
    name: 'Anystring — custom guitar & bass tuner',
    short_name: 'Anystring',
    description: 'Free tuner for guitar and bass with fully editable per-string tunings.',
    theme_color: '#0d1412',
    background_color: '#0d1412',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/app/',
    scope: '/app/',
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
    globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
    skipWaiting: true,
    clientsClaim: true,
  },
})

// https://vite.dev/config/
export default defineConfig({
  root: isNativeBuild ? resolve(root, 'app') : root,
  publicDir: isNativeBuild ? resolve(root, 'public') : 'public',
  base: isNativeBuild ? './' : '/',
  define: { __APP_VERSION__: JSON.stringify(version) },
  build: {
    outDir: isNativeBuild ? resolve(root, 'dist') : 'dist',
    emptyOutDir: true,
    rollupOptions: isNativeBuild
      ? undefined
      : {
          input: {
            main: resolve(root, 'index.html'),
            app: resolve(root, 'app/index.html'),
          },
        },
  },
  test: {
    // Config file lives at repo root; Vitest must resolve tests from there
    // even when CAP_BUILD is unset (root stays the repo).
    root,
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  plugins: isNativeBuild ? [react()] : [react(), pwa],
})
