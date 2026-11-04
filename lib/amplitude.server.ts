import { randomUUID } from 'node:crypto'
import { init, track, flush, Identify, identify, createInstance } from '@amplitude/analytics-node'

let initialized = false

function ensureInit() {
  if (initialized) return
  initialized = true
  init(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY!, {
    serverUrl: 'https://api.eu.amplitude.com/2/httpapi', // EU data region
    flushQueueSize: 10,
    flushIntervalMillis: 500,
  })
}

export function trackServer(
  eventName: string,
  eventProperties?: Record<string, unknown>,
  userId?: string,
) {
  ensureInit()
  track(eventName, eventProperties, { user_id: userId })
}

export function identifyServer(userId: string, userProperties: Record<string, unknown>) {
  ensureInit()
  const identifyObj = new Identify()
  for (const [key, value] of Object.entries(userProperties)) {
    identifyObj.set(key, value as string | number | boolean)
  }
  identify(identifyObj, { user_id: userId })
}

/** How long an anonymous event may take to reach Amplitude before it is given up. */
const ANONYMOUS_SEND_TIMEOUT_MS = 3000

let anonymous: ReturnType<typeof createInstance> | null = null
let anonymousReady: Promise<void> | null = null

// Its own client, not the shared one above: an anonymous event must never share
// a batch (and its status code) with another route's events, and a stalled send
// here must not hold up their flushes.
function anonymousClient(apiKey: string) {
  if (!anonymous) {
    anonymous = createInstance()
    anonymousReady = anonymous.init(apiKey, {
      serverUrl: 'https://api.eu.amplitude.com/2/httpapi', // EU data region
      flushQueueSize: 1,
      flushIntervalMillis: 100,
      flushMaxRetries: 2,
    }).promise
  }
  return { client: anonymous, ready: anonymousReady! }
}

/**
 * One event with no person behind it: a fresh random device id per call, no user
 * id, nothing that ties two events together. The request reaches Amplitude from
 * our server, so the person's IP never does. Waits for Amplitude's answer (a
 * serverless function must not freeze before the event left), but never longer
 * than ANONYMOUS_SEND_TIMEOUT_MS: the SDK's own request has no timeout. Rejects
 * when the key is missing, Amplitude refuses the event or the time runs out.
 */
export async function trackAnonymousServer(eventName: string, eventProperties: Record<string, unknown>) {
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
  if (!apiKey) throw new Error('NEXT_PUBLIC_AMPLITUDE_API_KEY is not set')
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      // The SDK keeps a stalled request's flush lock, so the next event on the
      // same client would wait behind it. Start the next event on a new client.
      anonymous = null
      anonymousReady = null
      reject(new Error(`Amplitude did not answer within ${ANONYMOUS_SEND_TIMEOUT_MS} ms`))
    }, ANONYMOUS_SEND_TIMEOUT_MS)
  })
  try {
    const result = await Promise.race([
      (async () => {
        const { client, ready } = anonymousClient(apiKey)
        await ready
        const sent = client.track(eventName, eventProperties, { device_id: randomUUID() })
        client.flush()
        return sent.promise
      })(),
      timeout,
    ])
    if (result.code !== 200) throw new Error(`Amplitude answered ${result.code}: ${result.message}`)
  } finally {
    clearTimeout(timer)
  }
}

export { flush as flushAmplitude }
