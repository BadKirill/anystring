import { loadAppStoreReport } from './storeRatings.ts'
import { publishStoreReport } from './storeTelemetry.ts'

const appId = process.env.TELEMETRYDECK_APP_ID ?? ''
if (appId === '') {
  process.stderr.write('TELEMETRYDECK_APP_ID is blank\n')
  process.exit(1)
}

const report = await loadAppStoreReport((url) =>
  fetch(url).then((response) => response.text()),
)
const count = await publishStoreReport(
  report,
  appId,
  new Date().toISOString(),
  async (url, body) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body,
    })
    if (!response.ok) {
      throw new Error(`TelemetryDeck ingest failed: ${String(response.status)}`)
    }
  },
)
process.stdout.write(`Sent ${String(count)} store signals\n`)
