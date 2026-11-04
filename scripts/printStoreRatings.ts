import { formatStoreReport, loadAppStoreReport } from './storeRatings.ts'

const report = await loadAppStoreReport((url) =>
  fetch(url).then((response) => response.text()),
)
process.stdout.write(`${formatStoreReport(report)}\n`)
