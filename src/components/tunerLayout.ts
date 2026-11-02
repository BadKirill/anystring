/** Below this, the window stays the phone column. Outer Duo is 466pt; the inner display is 669pt. */
export const PHONE_STACK_EXTENT = 560

export type CreaseAxis = 'horizontal' | 'vertical'

export type Fold =
  | { readonly active: false }
  | { readonly active: true; readonly axis: CreaseAxis; readonly band: number }

export type TunerLayout =
  | { readonly kind: 'stack' }
  | { readonly kind: 'grow' }
  | { readonly kind: 'split'; readonly axis: CreaseAxis; readonly gap: number }
  | { readonly kind: 'avoid'; readonly axis: CreaseAxis; readonly gap: number }

export interface LayoutSpace {
  readonly width: number
  readonly height: number
  readonly panes: 1 | 2
  readonly fold: Fold
}

export interface ReservedRect {
  readonly active: boolean
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

const INACTIVE_FOLD: Fold = { active: false }

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

function foldGap(fold: Fold): number {
  if (!fold.active || !Number.isFinite(fold.band) || fold.band <= 0) {
    return 0
  }
  return fold.band
}

/** A vertical crease splits left/right. A horizontal crease splits top/bottom. */
function paneAxis(crease: CreaseAxis): CreaseAxis {
  return crease === 'vertical' ? 'horizontal' : 'vertical'
}

function wideLayout(space: LayoutSpace): TunerLayout {
  const folding = space.fold.active ? space.fold : null
  const axis = folding ? paneAxis(folding.axis) : 'horizontal'
  const gap = folding ? foldGap(folding) : 0
  if (space.panes === 1) {
    return folding ? { kind: 'avoid', axis, gap } : { kind: 'grow' }
  }
  return { kind: 'split', axis, gap }
}

export function tunerLayout(space: LayoutSpace): TunerLayout {
  if (!finitePositive(space.width) || !finitePositive(space.height)) {
    return { kind: 'stack' }
  }
  const narrow = space.width < PHONE_STACK_EXTENT || space.height < PHONE_STACK_EXTENT
  if (narrow) {
    return { kind: 'stack' }
  }
  if (space.fold.active || space.width > space.height) {
    return wideLayout(space)
  }
  return { kind: 'grow' }
}

export function layoutGap(layout: TunerLayout): number {
  return layout.kind === 'split' || layout.kind === 'avoid' ? layout.gap : 0
}

export function layoutAxis(layout: TunerLayout): CreaseAxis | null {
  return layout.kind === 'split' || layout.kind === 'avoid' ? layout.axis : null
}

function spans(length: number, total: number): boolean {
  return total > 0 && length >= total * 0.6
}

function isDivision(region: ReservedRect, width: number, height: number): boolean {
  if (!region.active) {
    return false
  }
  const vertical = spans(region.height, height) && region.width < width * 0.5
  const horizontal = spans(region.width, width) && region.height < height * 0.5
  return vertical || horizontal
}

export function foldFromReserved(
  regions: readonly ReservedRect[],
  space: { readonly width: number; readonly height: number },
): Fold {
  const division = regions.find((region) => isDivision(region, space.width, space.height))
  if (!division) {
    return INACTIVE_FOLD
  }
  if (division.height >= division.width) {
    return { active: true, axis: 'vertical', band: Math.max(0, division.width) }
  }
  return { active: true, axis: 'horizontal', band: Math.max(0, division.height) }
}
