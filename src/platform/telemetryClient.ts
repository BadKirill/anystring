export const TELEMETRY_ENDPOINT = 'https://nom.telemetrydeck.com/v2/'

export interface TelemetryBody {
  appID: string
  clientUser: string
  sessionID: string
  type: string
  payload: Record<string, string>
  isTestMode: boolean
}

export async function hashClientUser(id: string): Promise<string> {
  const bytes = new TextEncoder().encode(id)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

async function hashedBody(body: TelemetryBody): Promise<Record<string, unknown>> {
  const clientUser = await hashClientUser(body.clientUser)
  const encoded: Record<string, unknown> = {
    appID: body.appID,
    clientUser,
    sessionID: body.sessionID,
    type: body.type,
    telemetryClientVersion: 'Anystring',
  }
  if (body.isTestMode) {
    encoded.isTestMode = true
  }
  if (Object.keys(body.payload).length > 0) {
    encoded.payload = body.payload
  }
  return encoded
}

export async function postTelemetry(bodies: TelemetryBody[]): Promise<void> {
  if (bodies.length === 0 || bodies.some((body) => body.appID === '')) {
    return
  }
  try {
    const payload = await Promise.all(bodies.map(hashedBody))
    await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    return
  }
}
