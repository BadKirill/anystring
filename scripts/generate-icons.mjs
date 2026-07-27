// Renders public/icon.svg into every raster the PWA and the native shells need.
// Native outputs overwrite the placeholders Capacitor scaffolds, and reuse the
// sizes already in the projects so re-running after `cap add` stays correct.
// Run with: node scripts/generate-icons.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = new URL('../', import.meta.url)
const BACKGROUND = '#0d1412'

const source = await readFile(new URL('public/icon.svg', ROOT), 'utf8')
const svg = Buffer.from(source)
// iOS and Android mask the corners themselves; a baked-in radius double-rounds.
const squareSvg = Buffer.from(source.replace(' rx="112"', ''))
// Adaptive-icon foregrounds and splash art sit on their own background layer.
const glyphSvg = Buffer.from(source.replace(/<rect[^>]*\/>\s*/, ''))

const path = (rel) => fileURLToPath(new URL(rel, ROOT))

function rasterize(svg, size) {
  return sharp(svg, { density: 512 }).resize(size, size, {
    fit: 'contain',
    background: '#00000000',
  })
}

function canvas(width, height, background) {
  return sharp({ create: { width, height, channels: 4, background } })
}

async function centered(width, height, background, artSize) {
  const art = await rasterize(glyphSvg, artSize).png().toBuffer()
  return canvas(width, height, background)
    .composite([{ input: art, gravity: 'centre' }])
    .png()
    .toBuffer()
}

function square(size) {
  return rasterize(squareSvg, size).png().toBuffer()
}

async function round(size) {
  const radius = size / 2
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<circle cx="${radius}" cy="${radius}" r="${radius}" fill="#fff"/></svg>`,
  )
  return sharp(await square(size))
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

// Android reserves the outer third of an adaptive foreground for masking.
const foreground = (size) => centered(size, size, '#00000000', Math.round(size * 0.66))

const splash = (width, height) =>
  centered(width, height, BACKGROUND, Math.round(Math.min(width, height) * 0.3))

async function sizeOf(file) {
  const { width, height } = await sharp(file).metadata()
  return { width, height }
}

async function write(rel, buffer) {
  await writeFile(path(rel), buffer)
  console.log(`wrote ${rel}`)
}

async function writeWebIcons() {
  const outputs = [
    { file: 'public/pwa-192x192.png', size: 192 },
    { file: 'public/pwa-512x512.png', size: 512 },
    { file: 'public/maskable-512x512.png', size: 512 },
    { file: 'public/apple-touch-icon.png', size: 180 },
  ]
  for (const { file, size } of outputs) {
    await write(file, await rasterize(svg, size).png().toBuffer())
  }
}

async function writeIosAssets() {
  const icons = 'ios/App/App/Assets.xcassets/AppIcon.appiconset'
  if (!existsSync(path(icons))) {
    return
  }
  await write(`${icons}/AppIcon-512@2x.png`, await square(1024))

  const splashes = 'ios/App/App/Assets.xcassets/Splash.imageset'
  const image = await splash(2732, 2732)
  for (const name of await readdir(path(splashes))) {
    if (name.endsWith('.png')) {
      await write(`${splashes}/${name}`, image)
    }
  }
}

const ANDROID_ICONS = {
  'ic_launcher.png': square,
  'ic_launcher_round.png': round,
  'ic_launcher_foreground.png': foreground,
}

async function writeAndroidIcons(res) {
  for (const dir of await readdir(path(res))) {
    if (!dir.startsWith('mipmap-') || dir.endsWith('-v26')) {
      continue
    }
    for (const [name, render] of Object.entries(ANDROID_ICONS)) {
      const file = `${res}/${dir}/${name}`
      const { width } = await sizeOf(path(file))
      await write(file, await render(width))
    }
  }
}

async function writeAndroidSplashes(res) {
  for (const dir of await readdir(path(res))) {
    const file = `${res}/${dir}/splash.png`
    if (!dir.startsWith('drawable') || !existsSync(path(file))) {
      continue
    }
    const { width, height } = await sizeOf(path(file))
    await write(file, await splash(width, height))
  }
}

async function writeAndroidAssets() {
  const res = 'android/app/src/main/res'
  if (!existsSync(path(res))) {
    return
  }
  await writeAndroidIcons(res)
  await writeAndroidSplashes(res)
}

await writeWebIcons()
await writeIosAssets()
await writeAndroidAssets()
