import { expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export type StorePlatform = 'ios' | 'android'

export interface MarketingCopy {
  eyebrow: string
  headline: string
}

export const STORE_CAPTURE_CSS = `
#splash { display: none !important; }
.app {
  padding-top: 64px !important;
  padding-bottom: 36px !important;
}
.overlay { background: rgb(0 0 0 / 78%) !important; }
.sheet-tall {
  max-height: 92dvh;
  height: 92dvh;
}
`

const FRAME_CSS = `
:root {
  color-scheme: dark;
  --bg: #0c1210;
  --accent: #1ed760;
  --text: #f4fbf6;
}
* { box-sizing: border-box; }
html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
}
body {
  display: flex;
  flex-direction: column;
  background-image:
    radial-gradient(ellipse 120% 70% at 50% 0%, #1a2a24 0%, transparent 62%);
}
.copy {
  flex: 0 0 auto;
  padding: 6.4vh 8.5vw 2.2vh;
  text-align: center;
}
.eyebrow {
  color: var(--accent);
  font-size: clamp(0.72rem, 1.55vh, 0.86rem);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  margin-bottom: 1.15vh;
}
.headline {
  font-size: clamp(1.72rem, 4.55vh, 2.55rem);
  font-weight: 800;
  letter-spacing: -0.038em;
  line-height: 1.12;
}
.stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 6.5vw 5.2vh;
}
.phone {
  position: relative;
  height: 100%;
  width: auto;
  max-width: 88%;
  aspect-ratio: var(--screen-aspect);
  border-radius: clamp(28px, 10.5vw, 52px);
  overflow: hidden;
  background: #050807;
  box-shadow:
    0 28px 70px rgb(0 0 0 / 48%),
    0 0 0 1px rgb(255 255 255 / 8%);
  container-type: inline-size;
}
.screen {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  pointer-events: none;
}
.status {
  position: absolute;
  inset: 0 0 auto 0;
  height: 5.6%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 6.6% 1.15%;
  color: var(--text);
  font-size: 12px;
  font-size: 3.15cqw;
  font-weight: 600;
  letter-spacing: -0.02em;
  pointer-events: none;
  z-index: 2;
}
.status-time { font-variant-numeric: tabular-nums; }
.status-icons {
  display: flex;
  align-items: flex-end;
  gap: 5px;
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: 1.5px;
  height: 11px;
}
.bars span {
  display: block;
  width: 3px;
  border-radius: 1px;
  background: currentColor;
}
.bars span:nth-child(1) { height: 4px; }
.bars span:nth-child(2) { height: 6px; }
.bars span:nth-child(3) { height: 8px; }
.bars span:nth-child(4) { height: 11px; }
.wifi-icon {
  display: block;
  width: 15px;
  height: 11px;
}
.battery {
  width: 22px;
  height: 11px;
  border: 1.5px solid currentColor;
  border-radius: 3px;
  position: relative;
  opacity: 0.95;
}
.battery::after {
  content: '';
  position: absolute;
  right: -3px;
  top: 2.5px;
  width: 2px;
  height: 4px;
  border-radius: 0 1px 1px 0;
  background: currentColor;
}
.battery::before {
  content: '';
  position: absolute;
  inset: 1.5px;
  background: currentColor;
  border-radius: 1px;
}
.home {
  position: absolute;
  left: 50%;
  bottom: 1.15%;
  width: 36%;
  height: 0.55%;
  min-height: 4px;
  border-radius: 99px;
  background: rgb(255 255 255 / 78%);
  transform: translateX(-50%);
  z-index: 2;
  pointer-events: none;
}
`

export function storePlatformFromProject(projectName: string): StorePlatform {
  return projectName.startsWith('ios') ? 'ios' : 'android'
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function headlineMarkup(headline: string): string {
  return escapeHtml(headline).replaceAll('\n', '<br />')
}

function statusBarHtml(platform: StorePlatform): string {
  const time = platform === 'ios' ? '9:41' : '12:00'
  return `<div class="status" aria-hidden="true">
    <span class="status-time">${time}</span>
    <span class="status-icons">
      <span class="bars"><span></span><span></span><span></span><span></span></span>
      <svg class="wifi-icon" viewBox="0 0 16 12" aria-hidden="true">
        <path d="M1 4.2c4.1-4 9.9-4 14 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M3.6 6.8c2.6-2.3 6.2-2.3 8.8 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="8" cy="10.1" r="1.15" fill="currentColor"/>
      </svg>
      <span class="battery"></span>
    </span>
  </div>`
}

export function marketingFrameHtml(input: {
  screenshotDataUrl: string
  copy: MarketingCopy
  platform: StorePlatform
  aspectRatio: string
}): string {
  const { screenshotDataUrl, copy, platform, aspectRatio } = input
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>${FRAME_CSS}</style>
</head>
<body style="--screen-aspect: ${aspectRatio}">
  <div class="copy">
    <div class="eyebrow">${escapeHtml(copy.eyebrow)}</div>
    <div class="headline">${headlineMarkup(copy.headline)}</div>
  </div>
  <div class="stage">
    <div class="phone">
      ${statusBarHtml(platform)}
      <img class="screen" alt="" src="${screenshotDataUrl}" />
      <div class="home"></div>
    </div>
  </div>
</body>
</html>`
}

async function waitForScreenImage(page: Page): Promise<void> {
  const image = page.locator('img.screen')
  await expect(image).toBeVisible()
  await image.evaluate((node) => {
    const img = node as HTMLImageElement
    if (img.complete && img.naturalWidth > 0) {
      return
    }
    return new Promise<void>((resolve, reject) => {
      img.addEventListener(
        'load',
        () => {
          resolve()
        },
        { once: true },
      )
      img.addEventListener(
        'error',
        () => {
          reject(new Error('framed screen image failed to load'))
        },
        { once: true },
      )
    })
  })
}

async function renderFramePage(source: Page, html: string): Promise<Page> {
  const viewport = source.viewportSize()
  if (viewport === null) {
    throw new Error('Store screenshot page has no viewport')
  }
  const frame = await source.context().newPage()
  await frame.setViewportSize(viewport)
  await frame.setContent(html, { waitUntil: 'load' })
  await waitForScreenImage(frame)
  return frame
}

export async function captureFramedScreenshot(
  page: Page,
  options: {
    copy: MarketingCopy
    platform: StorePlatform
    outputPath: string
  },
): Promise<void> {
  const viewport = page.viewportSize()
  if (viewport === null) {
    throw new Error('Store screenshot page has no viewport')
  }
  const png = await page.screenshot({
    fullPage: false,
    animations: 'disabled',
    type: 'png',
  })
  const html = marketingFrameHtml({
    screenshotDataUrl: `data:image/png;base64,${png.toString('base64')}`,
    copy: options.copy,
    platform: options.platform,
    aspectRatio: `${String(viewport.width)} / ${String(viewport.height)}`,
  })
  const frame = await renderFramePage(page, html)
  await mkdir(path.dirname(options.outputPath), { recursive: true })
  await frame.screenshot({
    path: options.outputPath,
    fullPage: false,
    animations: 'disabled',
    type: 'png',
  })
  await frame.close()
}

export async function assertStorePngSize(
  filePath: string,
  platform: StorePlatform,
): Promise<void> {
  const meta = await sharp(filePath).metadata()
  if (platform === 'ios') {
    expect(meta.width).toBe(1290)
    expect(meta.height).toBe(2796)
    return
  }
  expect(meta.width).toBe(1080)
  expect(meta.height).toBe(1920)
}
