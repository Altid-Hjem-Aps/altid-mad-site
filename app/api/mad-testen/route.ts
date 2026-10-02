import { NextRequest, NextResponse } from 'next/server'
import { getMadTestOptin, recordMadTestOptin } from '@/lib/db'
import { eligibleSignup } from '@/lib/mad-test-access'
import {
  MAD_TEST_COPY_VERSION,
  isMadTestDevice,
  googleAccountPrefill,
  normalizeGoogleAccount,
  renderMadTestScreen,
  type MadTestScreen,
} from '@/lib/mad-test'

// Mad-testen yes-page (ALT-345). The invitation mail links here with
// ?t=<unsub_token>&d=iphone or &d=android, one button per phone. GET only SHOWS
// that phone's route (iPhone: one confirming button; Android: the Google-account
// step; no d: both answers) and writes nothing, so a mail scanner opening the
// link cannot answer for anyone. POST (a button,
// device=iphone|android) writes. Android takes a second POST with the Google
// account on the phone; the first Android POST writes nothing and shows that
// step.
// No cookie: the token rides in the form action's query string, as in
// /api/unsubscribe. Who the token belongs to: lib/mad-test-access.ts.
// The form, the iPhone route and the Google-account step tell
// /api/mad-testen/open that a real browser showed them (see reportOpen in
// lib/mad-test.ts); this route itself records no visit.

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

export async function GET(req: NextRequest) {
  try {
    const found = await eligibleSignup(req)
    if (!found) return invalid()
    const earlier = await getMadTestOptin(found.signup.publicId)
    if (earlier) return respond({ kind: 'already', device: earlier.device }, 200)
    const phone = req.nextUrl.searchParams.get('d')
    if (phone === 'iphone') {
      return respond({ kind: 'confirm', firstName: found.signup.firstName, token: found.token }, 200)
    }
    if (phone === 'android') {
      const value = googleAccountPrefill(found.signup.email)
      return respond({ kind: 'google', token: found.token, value, retry: false }, 200)
    }
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
    // Only our buttons can send an answer. A POST without one (a scanner, a
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

    let googleAccount: string | null = null
    if (device === 'android') {
      const typed = form.get('google_account')
      if (typed === null) {
        // The Android button: ask for the Google account, write nothing yet.
        // A Gmail signup address starts the field; any other starts it empty.
        const value = googleAccountPrefill(found.signup.email)
        return respond({ kind: 'google', token: found.token, value, retry: false }, 200)
      }
      googleAccount = normalizeGoogleAccount(typed)
      if (googleAccount === null) {
        const value = typeof typed === 'string' ? typed.slice(0, 254) : ''
        return respond({ kind: 'google', token: found.token, value, retry: true }, 200)
      }
    }

    await recordMadTestOptin(found.signup.publicId, MAD_TEST_COPY_VERSION, device, googleAccount)
    // Read back what is stored: if two answers raced, the first row won and the
    // screen must describe that row, not the losing request. Two Android
    // answers with different Google accounts are two answers too: the second
    // must not be thanked for an account that was never stored.
    const stored = await getMadTestOptin(found.signup.publicId)
    if (!stored) throw new Error('mad_test_optin row missing right after insert')
    if (stored.device !== device || stored.googleAccount !== googleAccount) {
      return respond({ kind: 'already', device: stored.device }, 200)
    }
    return respond({ kind: 'thanks', device, firstName: found.signup.firstName }, 200)
  } catch (e) {
    console.error('mad-testen POST failed', e)
    return failed()
  }
}
