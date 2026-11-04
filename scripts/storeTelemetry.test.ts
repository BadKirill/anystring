import { describe, expect, it } from 'vitest'

import { parseReviewFeed, parseStorefront, type StoreReport } from './storeRatings.ts'
import { publishStoreReport, storeTelemetryEvents } from './storeTelemetry.ts'

const observedAt = '2026-11-05T00:21:00+01:00'

function lookup(count: number, average: number | null, version = '1.4.1') {
  return {
    resultCount: 1,
    results: [
      {
        userRatingCount: count,
        averageUserRating: average,
        userRatingCountForCurrentVersion: count,
        averageUserRatingForCurrentVersion: average,
        version,
      },
    ],
  }
}

function review(id: string, body = 'Tunes drop D.') {
  return {
    id: { label: id },
    'im:rating': { label: '5' },
    'im:version': { label: '1.4.1' },
    title: { label: 'Solid' },
    content: { label: body },
    updated: { label: '2026-11-02T10:00:00-07:00' },
    author: { name: { label: 'A player' } },
  }
}

function report(
  storefronts: StoreReport['storefronts'],
  reviews: StoreReport['reviews'],
): StoreReport {
  return { countriesChecked: 26, storefronts, reviews }
}

function row(country: string, count: number, average: number) {
  const parsed = parseStorefront(country, lookup(count, average))
  if (parsed === null) throw new Error('expected storefront')
  return parsed
}

describe('storeTelemetryEvents', () => {
  it('EC-store-signal-blank-app: a blank app id sends nothing', () => {
    expect(storeTelemetryEvents(report([], []), '', observedAt)).toEqual([])
  })

  it('EC-store-signal-empty: no ratings still publish a zero snapshot', () => {
    const events = storeTelemetryEvents(report([], []), 'app-1', observedAt)
    expect(events.map((event) => event.type)).toEqual(['store.ratings', 'store.reviews'])
    expect(events[0]).toMatchObject({
      appID: 'app-1',
      clientUser: 'anystring-store-report',
      sessionID: 'store-2026-11-05',
      type: 'store.ratings',
      receivedAt: observedAt,
      isTestMode: 'false',
      floatValue: 0,
      'Store.reviewCount': 0,
      'Store.storefronts': 'none',
      'Store.reviews': 'none',
    })
    expect(events[0]?.['Store.note']).toContain('no public timestamp')
    expect(events[0]?.['Store.play']).toContain('Google Play')
  })

  it('EC-store-signal-single: one rating keeps that star and the total', () => {
    const events = storeTelemetryEvents(
      report([row('us', 1, 5)], []),
      'app-1',
      observedAt,
    )
    expect(events.map((event) => event.type)).toEqual([
      'store.ratings',
      'store.reviews',
      'store.country',
    ])
    expect(events[0]?.floatValue).toBe(1)
    expect(events[1]?.floatValue).toBe(0)
    expect(events[2]).toMatchObject({
      floatValue: 1,
      'Store.country': 'us',
      'Store.star': 5,
      'Store.label': 'us · 5 stars',
      'Store.version': '1.4.1',
    })
    expect(events[1]?.['Store.average']).toBeUndefined()
  })

  it('EC-store-signal-average: several ratings stay an average', () => {
    const events = storeTelemetryEvents(
      report([row('gb', 4, 4.5)], []),
      'app-1',
      observedAt,
    )
    const country = events.find((event) => event.type === 'store.country')
    expect(country).toMatchObject({ floatValue: 4, 'Store.average': 4.5 })
    expect(country?.['Store.star']).toBeUndefined()
  })

  it('EC-store-signal-sum: country counts add up on the snapshot', () => {
    const events = storeTelemetryEvents(
      report([row('rs', 1, 5), row('us', 1, 5)], []),
      'app-1',
      observedAt,
    )
    expect(events[0]?.floatValue).toBe(2)
    expect(events[0]?.['Store.storefronts']).toContain('us')
    expect(events[0]?.['Store.storefronts']).toContain('rs')
  })

  it('EC-store-signal-review: a written review keeps its own date on the snapshot', () => {
    const reviews = parseReviewFeed('us', { feed: { entry: review('rev-1') } })
    const events = storeTelemetryEvents(report([], reviews), 'app-1', observedAt)
    expect(events.map((event) => event.type)).toEqual(['store.ratings', 'store.reviews'])
    expect(events[0]?.receivedAt).toBe(observedAt)
    expect(events[1]?.floatValue).toBe(1)
    expect(events[1]?.receivedAt).toBe(observedAt)
    expect(events[0]?.['Store.reviewCount']).toBe(1)
    expect(events[0]?.['Store.reviews']).toContain('2026-11-02T10:00:00-07:00')
    expect(events[0]?.['Store.reviews']).toContain('Solid')
  })

  it('EC-store-signal-review-long: a huge review body is shortened', () => {
    const reviews = parseReviewFeed('us', {
      feed: { entry: review('rev-1', 'x'.repeat(5000)) },
    })
    const events = storeTelemetryEvents(report([], reviews), 'app-1', observedAt)
    const text = events[0]?.['Store.reviews']
    expect(typeof text).toBe('string')
    expect(String(text).length).toBeLessThan(2500)
    expect(String(text).endsWith('…')).toBe(true)
  })
})

describe('publishStoreReport', () => {
  it('EC-store-signal-post: the snapshot is posted as one v3 batch', async () => {
    let body = ''
    let url = ''
    const count = await publishStoreReport(
      report([row('us', 1, 5)], []),
      'app-1',
      observedAt,
      async (target, payload) => {
        url = target
        body = payload
      },
    )
    expect(count).toBe(3)
    expect(url).toBe('https://nom.telemetrydeck.com/v3/com.kirillplokhoi/')
    const sent = JSON.parse(body) as unknown[]
    expect(sent).toHaveLength(3)
  })

  it('EC-store-signal-skip: a blank app id does not post', async () => {
    let called = false
    const count = await publishStoreReport(report([], []), '', observedAt, async () => {
      called = true
    })
    expect(count).toBe(0)
    expect(called).toBe(false)
  })
})
