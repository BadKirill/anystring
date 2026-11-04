export const APP_STORE_ID = '6806879721'

export const RATING_COUNTRIES = [
  'us',
  'gb',
  'ca',
  'au',
  'de',
  'fr',
  'es',
  'it',
  'nl',
  'pt',
  'br',
  'mx',
  'jp',
  'kr',
  'ru',
  'tr',
  'pl',
  'se',
  'cz',
  'sk',
  'id',
  'th',
  'il',
  'lt',
  'rs',
  'ua',
] as const

export interface Storefront {
  country: string
  ratingCount: number
  average: number | null
  currentVersionRatingCount: number
  currentVersionAverage: number | null
  version: string
  star: number | null
}

export interface WrittenReview {
  id: string
  country: string
  rating: number
  title: string
  body: string
  updated: string
  version: string
  author: string
}

export interface StoreReport {
  countriesChecked: number
  storefronts: Storefront[]
  reviews: WrittenReview[]
}

export function parseStorefront(country: string, payload: unknown): Storefront | null {
  const row = firstResult(payload)
  if (row === null) return null
  const ratingCount = countOf(row.userRatingCount)
  const currentVersionRatingCount = countOf(row.userRatingCountForCurrentVersion)
  const average = averageOf(ratingCount, row.averageUserRating)
  const currentVersionAverage = averageOf(
    currentVersionRatingCount,
    row.averageUserRatingForCurrentVersion,
  )
  return {
    country,
    ratingCount,
    average,
    currentVersionRatingCount,
    currentVersionAverage,
    version: typeof row.version === 'string' ? row.version : '',
    star: starOf(ratingCount, average),
  }
}

export function parseReviewFeed(country: string, payload: unknown): WrittenReview[] {
  if (!isRecord(payload) || !isRecord(payload.feed)) return []
  return entriesOf(payload.feed.entry).flatMap((entry) => {
    const parsed = parseReview(country, entry)
    return parsed === null ? [] : [parsed]
  })
}

export function dedupeReviews(reviews: readonly WrittenReview[]): WrittenReview[] {
  const seen = new Set<string>()
  const unique: WrittenReview[] = []
  for (const review of reviews) {
    if (review.id !== '' && seen.has(review.id)) continue
    if (review.id !== '') seen.add(review.id)
    unique.push(review)
  }
  return unique
}

export function formatStoreReport(report: StoreReport): string {
  const lines = [
    'App Store',
    `Checked ${String(report.countriesChecked)} storefronts. ${String(report.storefronts.length)} with ratings. Written reviews: ${String(report.reviews.length)}.`,
    'A rating without a written review has no public timestamp.',
    ...report.storefronts.map(formatStorefront),
    'Reviews',
    ...formatReviews(report.reviews),
    'Google Play',
    'Public totals and per-rating dates are not published.',
  ]
  return lines.join('\n')
}

export async function loadAppStoreReport(
  fetchText: (url: string) => Promise<string>,
  countries: readonly string[] = RATING_COUNTRIES,
): Promise<StoreReport> {
  const loaded = await Promise.all(
    countries.map((country) => loadCountry(country, fetchText)),
  )
  const storefronts = loaded
    .map((row) => row.storefront)
    .filter((row): row is Storefront => row !== null && row.ratingCount > 0)
    .sort((left, right) => left.country.localeCompare(right.country))
  return {
    countriesChecked: countries.length,
    storefronts,
    reviews: dedupeReviews(loaded.flatMap((row) => row.reviews)),
  }
}

function lookupUrl(country: string): string {
  return `https://itunes.apple.com/lookup?id=${APP_STORE_ID}&country=${country}`
}

function reviewsUrl(country: string): string {
  return `https://itunes.apple.com/${country}/rss/customerreviews/id=${APP_STORE_ID}/sortBy=mostRecent/json`
}

async function loadCountry(
  country: string,
  fetchText: (url: string) => Promise<string>,
): Promise<{ storefront: Storefront | null; reviews: WrittenReview[] }> {
  const [lookupText, reviewText] = await Promise.all([
    fetchText(lookupUrl(country)),
    fetchText(reviewsUrl(country)),
  ])
  return {
    storefront: parseStorefront(country, JSON.parse(lookupText) as unknown),
    reviews: parseReviewFeed(country, JSON.parse(reviewText) as unknown),
  }
}

function formatStorefront(row: Storefront): string {
  const stars =
    row.star === null
      ? `${String(row.ratingCount)} ratings, average ${String(row.average)}`
      : `${String(row.ratingCount)} × ${String(row.star)} stars`
  return `${row.country}  ${stars}  version ${row.version}`
}

function formatReviews(reviews: readonly WrittenReview[]): string[] {
  if (reviews.length === 0) return ['  none']
  return reviews.flatMap((review) => [
    `${review.updated}  ${review.country}  ${String(review.rating)}  ${review.version}  ${review.author}`,
    `${review.title} — ${review.body}`,
  ])
}

function firstResult(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null
  for (const item of unknownList(payload.results)) {
    if (isRecord(item)) return item
  }
  return null
}

function unknownList(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) return []
  return value.map((item: unknown) => item)
}

function parseReview(
  country: string,
  entry: Record<string, unknown>,
): WrittenReview | null {
  const rating = Number(labelOf(entry['im:rating']))
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null
  return {
    id: labelOf(entry.id),
    country,
    rating,
    title: labelOf(entry.title),
    body: labelOf(entry.content),
    updated: labelOf(entry.updated),
    version: labelOf(entry['im:version']),
    author: authorOf(entry.author),
  }
}

function entriesOf(entry: unknown): Record<string, unknown>[] {
  if (Array.isArray(entry)) return entry.filter(isRecord)
  return isRecord(entry) ? [entry] : []
}

function authorOf(author: unknown): string {
  if (!isRecord(author)) return ''
  return labelOf(author.name)
}

function countOf(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0
}

function averageOf(count: number, value: unknown): number | null {
  if (count === 0 || typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

function starOf(count: number, average: number | null): number | null {
  if (count !== 1 || average === null || !Number.isInteger(average)) return null
  if (average < 1 || average > 5) return null
  return average
}

function labelOf(value: unknown): string {
  if (!isRecord(value) || typeof value.label !== 'string') return ''
  return value.label
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
