import { NextRequest, NextResponse } from 'next/server'
import { trackAnonymousServer } from '@/lib/amplitude.server'
import { checkRateLimitStrict } from '@/lib/db'
import { STORES, STORE_POSITIONS, type Store, type StorePosition } from '@/lib/store-links'

// A store badge click, counted from our server: POST {store, position}, sent by
// components/StoreBadges.tsx with sendBeacon. Anonymous, a fresh device id per
// event, no cookie read or set, and the person's IP never reaches Amplitude.

export const dynamic = 'force-dynamic'

const CLICKS_PER_IP_PER_HOUR = 60
// So rotating IPs cannot inflate the count without a ceiling.
const CLICKS_PER_HOUR_GLOBAL = 1000
// {"store":"appstore","position":"bottom"} is about 40 bytes.
const MAX_BODY_BYTES = 512

function answer(status: number): NextResponse {
  return new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } })
}

function parseClick(text: string): { store: Store; position: StorePosition } | null {
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const { store, position } = body as Record<string, unknown>
  if (!STORES.includes(store as Store) || !STORE_POSITIONS.includes(position as StorePosition)) return null
  return { store: store as Store, position: position as StorePosition }
}

export async function POST(req: NextRequest) {
  // JSON only: a cross-site form cannot send it without a CORS preflight, which
  // this route does not grant.
  const type = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase()
  if (type !== 'application/json') return answer(415)

  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return answer(413)
  const text = await req.text()
  if (text.length > MAX_BODY_BYTES) return answer(413)
  const click = parseClick(text)
  if (!click) return answer(400)

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  try {
    if (await checkRateLimitStrict(`store-click:${ip}`, CLICKS_PER_IP_PER_HOUR, 3600)) return answer(429)
    if (await checkRateLimitStrict('store-click:global', CLICKS_PER_HOUR_GLOBAL, 3600)) return answer(429)
    await trackAnonymousServer('Store Badge Clicked', click)
  } catch (e) {
    console.error('store click not recorded', e instanceof Error ? e.message : e)
    return answer(502)
  }
  return answer(204)
}
