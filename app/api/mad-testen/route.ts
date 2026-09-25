import { NextRequest, NextResponse } from 'next/server'
import { getSignupByUnsubToken, getMadTestOptin, recordMadTestOptin } from '@/lib/db'
import {
  MAD_TEST_COPY_VERSION,
  isMadTestDevice,
  isMadTestEligible,
  renderMadTestScreen,
  type MadTestScreen,
} from '@/lib/mad-test'

// Mad-testen yes-page (ALT-345). The invitation mail links here with
// ?t=<unsub_token>. GET only SHOWS the two answer buttons and writes nothing, so
// a mail scanner opening the link cannot answer for anyone. POST (a button,
// device=iphone|android) writes.
// No cookie: the token rides in the form action's query string, as in
// /api/unsubscribe.

// signup.unsub_token is a Postgres uuid column. Anything else never reaches the
// database: PostgREST answers a non-uuid filter with 22P02, which would turn a
// mangled link into a 500 instead of the invalid-link screen.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function respond(screen: MadTestScreen, status: number) {
  return new NextResponse(renderMadTestScreen(screen), {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Per-person page behind a secret link: never cached, never indexed, and
      // the link itself must not leak onward in a Referer header.
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  })
}

// One screen and one status for every reason a link is refused (no token,
// not a uuid, unknown token, unsubscribed, no Mad consent, Hjem-form signup), so the page
// never reveals who is on the list.
const invalid = () => respond({ kind: 'invalid' }, 400)
const failed = () => respond({ kind: 'error' }, 500)

async function eligibleSignup(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get('t') ?? '').trim()
  if (!UUID.test(token)) return null
  const signup = await getSignupByUnsubToken(token)
  if (!signup || !isMadTestEligible(signup)) return null
  return { token, signup }
}

export async function GET(req: NextRequest) {
  try {
    const found = await eligibleSignup(req)
    if (!found) return invalid()
    const earlier = await getMadTestOptin(found.signup.publicId)
    if (earlier) return respond({ kind: 'already', device: earlier.device }, 200)
    return respond({ kind: 'form', firstName: found.signup.firstName, token: found.token }, 200)
  } catch (e) {
    console.error('mad-testen GET failed', e)
    return failed()
  }
}

export async function POST(req: NextRequest) {
  try {
    const found = await eligibleSignup(req)
    if (!found) return invalid()
    // Only our two buttons can send an answer. A POST without one (a scanner, a
    // hand-made request) is refused and writes nothing. A body that is not form
    // data at all (JSON, text/plain, no content type) makes formData() throw;
    // that is the same refusal, not a server error.
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return invalid()
    }
    const device = form.get('device')
    if (!isMadTestDevice(device)) return invalid()

    const earlier = await getMadTestOptin(found.signup.publicId)
    if (earlier) return respond({ kind: 'already', device: earlier.device }, 200)

    await recordMadTestOptin(found.signup.publicId, MAD_TEST_COPY_VERSION, device)
    // Read back what is stored: if two answers raced, the first row won and the
    // screen must describe that row, not the losing request.
    const stored = await getMadTestOptin(found.signup.publicId)
    if (!stored) throw new Error('mad_test_optin row missing right after insert')
    if (stored.device !== device) return respond({ kind: 'already', device: stored.device }, 200)
    return respond({ kind: 'thanks', device }, 200)
  } catch (e) {
    console.error('mad-testen POST failed', e)
    return failed()
  }
}
