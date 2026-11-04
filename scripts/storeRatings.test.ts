import { describe, expect, it } from 'vitest'

import {
  dedupeReviews,
  formatStoreReport,
  loadAppStoreReport,
  parseReviewFeed,
  parseStorefront,
} from './storeRatings.ts'

function lookup(count: number, average: number | null, version = '1.3.5') {
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

function review(id: string, rating = '5') {
  return {
    id: { label: id },
    'im:rating': { label: rating },
    'im:version': { label: '1.3.5' },
    title: { label: 'Solid' },
    content: { label: 'Tunes drop D.' },
    updated: { label: '2026-11-02T10:00:00-07:00' },
    author: { name: { label: 'A player' } },
  }
}

describe('parseStorefront', () => {
  it('EC-store-rating-missing: an empty lookup is not a storefront', () => {
    expect(parseStorefront('us', { resultCount: 0, results: [] })).toBeNull()
    expect(parseStorefront('us', null)).toBeNull()
  })

  it('EC-store-rating-zero: a listed app with no ratings has a null average', () => {
    expect(parseStorefront('de', lookup(0, 0))).toEqual({
      country: 'de',
      ratingCount: 0,
      average: null,
      currentVersionRatingCount: 0,
      currentVersionAverage: null,
      version: '1.3.5',
      star: null,
    })
  })

  it('EC-store-rating-single: one rating is that exact star', () => {
    expect(parseStorefront('us', lookup(1, 5))).toMatchObject({
      country: 'us',
      ratingCount: 1,
      average: 5,
      star: 5,
      version: '1.3.5',
    })
  })

  it('EC-store-rating-average-only: several ratings stay an average', () => {
    const row = parseStorefront('gb', lookup(4, 4.5))
    expect(row).not.toBeNull()
    if (row === null) return
    expect(row.star).toBeNull()
    expect(row.average).toBe(4.5)
  })
})

describe('parseReviewFeed', () => {
  it('EC-store-review-empty: a feed with no entries has no reviews', () => {
    expect(parseReviewFeed('us', { feed: {} })).toEqual([])
  })

  it('EC-store-review-app-entry: the app record in the feed is not a review', () => {
    expect(
      parseReviewFeed('us', {
        feed: { entry: [{ 'im:name': { label: 'Anystring' }, id: { label: 'app' } }] },
      }),
    ).toEqual([])
  })

  it('EC-store-review-single-object: one review object is still a review', () => {
    expect(parseReviewFeed('rs', { feed: { entry: review('rev-1') } })).toEqual([
      {
        id: 'rev-1',
        country: 'rs',
        rating: 5,
        title: 'Solid',
        body: 'Tunes drop D.',
        updated: '2026-11-02T10:00:00-07:00',
        version: '1.3.5',
        author: 'A player',
      },
    ])
  })

  it('EC-store-review-bad-rating: a non-numeric rating is dropped', () => {
    expect(
      parseReviewFeed('us', { feed: { entry: [review('rev-x', 'great')] } }),
    ).toEqual([])
  })
})

describe('dedupeReviews', () => {
  it('EC-store-review-dedupe: the same review id from two storefronts counts once', () => {
    const first = parseReviewFeed('us', { feed: { entry: review('rev-1') } })
    const second = parseReviewFeed('rs', { feed: { entry: review('rev-1') } })
    expect(dedupeReviews([...first, ...second])).toEqual(first)
  })
})

describe('formatStoreReport', () => {
  it('lists exact stars, written reviews, and the missing Play dates', () => {
    const text = formatStoreReport({
      countriesChecked: 2,
      storefronts: [parseStorefront('us', lookup(1, 5))].filter((row) => row !== null),
      reviews: parseReviewFeed('us', { feed: { entry: review('rev-1') } }),
    })
    expect(text).toContain('us  1 × 5 stars  version 1.3.5')
    expect(text).toContain('2026-11-02T10:00:00-07:00  us  5  1.3.5  A player')
    expect(text).toContain('Solid — Tunes drop D.')
    expect(text).toContain('no public timestamp')
    expect(text).toContain('Google Play')
  })
})

describe('loadAppStoreReport', () => {
  it('keeps storefronts with ratings and dedupes reviews', async () => {
    const seen: string[] = []
    const report = await loadAppStoreReport(
      async (url) => {
        seen.push(url)
        if (url.includes('lookup') && url.includes('country=us')) {
          return JSON.stringify(lookup(1, 5))
        }
        if (url.includes('lookup')) return JSON.stringify(lookup(0, 0))
        if (url.includes('/us/rss')) {
          return JSON.stringify({ feed: { entry: [review('rev-1')] } })
        }
        return JSON.stringify({ feed: { entry: [review('rev-1')] } })
      },
      ['us', 'de'],
    )
    expect(report.storefronts.map((row) => row.country)).toEqual(['us'])
    expect(report.reviews).toHaveLength(1)
    expect(seen.some((url) => url.includes('id=6806879721'))).toBe(true)
  })
})
