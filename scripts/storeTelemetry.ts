import type { StoreReport, Storefront, WrittenReview } from './storeRatings.ts'

export const STORE_INGEST_URL = 'https://nom.telemetrydeck.com/v3/com.kirillplokhoi/'

const REVIEW_TEXT_LIMIT = 2000
const STORE_USER = 'anystring-store-report'

export interface StoreTelemetryEvent {
  appID: string
  clientUser: string
  sessionID: string
  type: string
  receivedAt: string
  isTestMode: 'false'
  floatValue: number
  [key: string]: string | number
}

export function storeTelemetryEvents(
  report: StoreReport,
  appId: string,
  observedAt: string,
): StoreTelemetryEvent[] {
  if (appId === '') return []
  return [
    summaryEvent(report, appId, observedAt),
    reviewEvent(report, appId, observedAt),
    ...report.storefronts.map((row) => countryEvent(row, appId, observedAt)),
  ]
}

export async function publishStoreReport(
  report: StoreReport,
  appId: string,
  observedAt: string,
  post: (url: string, body: string) => Promise<void>,
): Promise<number> {
  const events = storeTelemetryEvents(report, appId, observedAt)
  if (events.length === 0) return 0
  await post(STORE_INGEST_URL, JSON.stringify(events))
  return events.length
}

function summaryEvent(
  report: StoreReport,
  appId: string,
  observedAt: string,
): StoreTelemetryEvent {
  const ratingCount = report.storefronts.reduce((sum, row) => sum + row.ratingCount, 0)
  return {
    ...baseEvent(appId, observedAt, 'store.ratings', ratingCount),
    'Store.ratingCount': ratingCount,
    'Store.reviewCount': report.reviews.length,
    'Store.storefronts': linesOrNone(report.storefronts.map(storefrontLine)),
    'Store.reviews': shorten(linesOrNone(report.reviews.map(reviewLine))),
    'Store.note': 'A rating without a written review has no public timestamp.',
    'Store.play': 'Google Play does not publish totals or per-rating dates.',
  }
}

function reviewEvent(
  report: StoreReport,
  appId: string,
  observedAt: string,
): StoreTelemetryEvent {
  return {
    ...baseEvent(appId, observedAt, 'store.reviews', report.reviews.length),
    'Store.reviewCount': report.reviews.length,
    'Store.reviews': shorten(linesOrNone(report.reviews.map(reviewLine))),
  }
}

function countryEvent(
  row: Storefront,
  appId: string,
  observedAt: string,
): StoreTelemetryEvent {
  const event = baseEvent(appId, observedAt, 'store.country', row.ratingCount)
  event['Store.country'] = row.country
  event['Store.ratingCount'] = row.ratingCount
  event['Store.version'] = row.version
  event['Store.label'] = storefrontLabel(row)
  if (row.star !== null) event['Store.star'] = row.star
  else if (row.average !== null) event['Store.average'] = row.average
  return event
}

function baseEvent(
  appId: string,
  observedAt: string,
  type: string,
  floatValue: number,
): StoreTelemetryEvent {
  return {
    appID: appId,
    clientUser: STORE_USER,
    sessionID: `store-${observedAt.slice(0, 10)}`,
    type,
    receivedAt: observedAt,
    isTestMode: 'false',
    floatValue,
  }
}

function storefrontLabel(row: Storefront): string {
  if (row.star !== null) return `${row.country} · ${String(row.star)} stars`
  return `${row.country} · average ${String(row.average)}`
}

function storefrontLine(row: Storefront): string {
  const stars =
    row.star === null
      ? `${String(row.ratingCount)} ratings, average ${String(row.average)}`
      : `${String(row.ratingCount)} × ${String(row.star)} stars`
  return `${row.country} ${stars} version ${row.version}`
}

function reviewLine(review: WrittenReview): string {
  return `${review.updated} ${review.country} ${String(review.rating)} ${review.version} ${review.author}: ${review.title} — ${review.body}`
}

function linesOrNone(lines: readonly string[]): string {
  return lines.length === 0 ? 'none' : lines.join('; ')
}

function shorten(text: string): string {
  if (text.length <= REVIEW_TEXT_LIMIT) return text
  return `${text.slice(0, REVIEW_TEXT_LIMIT - 1)}…`
}
