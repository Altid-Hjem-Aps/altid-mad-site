import { init, setOptOut } from '@amplitude/analytics-browser'

// Amplitude in the browser runs only after the visitor chose "Accepter alle".
// Before that, amplitude.track() calls from components are held in the SDK's
// pre-init queue and never leave the browser unless init() is called.
let started = false

export function startAnalytics() {
  if (started) return
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY
  if (!apiKey) return
  started = true
  init(apiKey, {
    serverUrl: 'https://api.eu.amplitude.com/2/httpapi',
    fetchRemoteConfig: false,
    autocapture: {
      attribution: true,
      pageViews: true,
      sessions: true,
      formInteractions: true,
      fileDownloads: true,
      elementInteractions: true,
      frustrationInteractions: true,
      pageUrlEnrichment: true,
      networkTracking: true,
      webVitals: true,
    },
  })
}

// Withdrawal: stop sending now and remove what Amplitude stored in this
// browser (its AMP_* cookies and localStorage keys), so nothing links a
// later visit to this one.
export function stopAnalytics() {
  if (started) setOptOut(true)
  started = false
  removeAmplitudeStorage()
}

export function removeAmplitudeStorage() {
  const host = window.location.hostname
  const apex = host.replace(/^www\./, '')
  for (const part of document.cookie.split(';')) {
    const name = part.split('=')[0]?.trim()
    if (!name || !name.startsWith('AMP_')) continue
    const expire = `${name}=; Max-Age=0; Path=/`
    document.cookie = expire
    document.cookie = `${expire}; Domain=.${apex}`
  }
  try {
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (key?.startsWith('AMP_')) keys.push(key)
    }
    keys.forEach((k) => window.localStorage.removeItem(k))
  } catch {}
}
