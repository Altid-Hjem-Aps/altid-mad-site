import { NextRequest, NextResponse } from 'next/server'
import { verifyConfirmToken, CONFIRM_COOKIE, CONFIRM_COOKIE_PATH } from '@/lib/consent-token'

// Landing point for the button in the confirmation email.
//
// GET only moves the token into an httpOnly cookie and redirects. It writes
// NOTHING. The consent is written by the POST on /bekraeft, behind a button the
// person has to press. That split is the whole point: corporate mail scanners
// (Safe Links, Proofpoint, Barracuda) auto-open every URL in an email before a
// human ever sees it, so a link that recorded consent on GET would have the
// scanner consent on the person's behalf. /api/unsubscribe already splits
// GET/POST for exactly this reason.
//
// The token goes in a cookie rather than staying in the URL because Amplitude
// autocapture runs with pageViews + pageUrlEnrichment: a token in the address
// bar would be shipped to Amplitude with every page view, and would also sit in
// browser history and referrer headers.

// TRANSITION (remove after ~mid-Aug 2026): pre-deploy cookies were set with
// Path=/. Browsers key cookies on (name, domain, path), so the scoped cookie
// below cannot overwrite or delete them, and a stale root cookie can shadow a
// fresh one on /bekraeft for up to its 30-minute life. Expire the legacy
// variant on every response from this endpoint.
function expireLegacyRootCookie(res: NextResponse) {
  res.cookies.set(CONFIRM_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  const confirmPage = new URL('/bekraeft', req.nextUrl.origin)

  // Verify before setting anything, so a dead link never plants a cookie.
  const claim = verifyConfirmToken(token, Date.now() / 1000)
  if (!claim) {
    if (token) console.error('api/bekraeft: rejected confirm token — expired, mangled, or wrong key')
    // The page renders the "linket virker ikke længere" state when no valid
    // cookie is present, so send them there rather than to a dead end. Also
    // expire any RETAINED cookie from an earlier confirmation (this endpoint
    // can't read it — Path=/bekraeft doesn't match /api/bekraeft — but it can
    // blind-delete it): the person clicked THIS dead link, and resurrecting a
    // previous token's form here would answer a question they didn't ask.
    const res = NextResponse.redirect(confirmPage, 302)
    res.cookies.set(CONFIRM_COOKIE, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: CONFIRM_COOKIE_PATH,
      maxAge: 0,
    })
    expireLegacyRootCookie(res)
    res.headers.set('Cache-Control', 'private, no-store')
    return res
  }

  const res = NextResponse.redirect(confirmPage, 302)
  res.cookies.set(CONFIRM_COOKIE, token as string, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    // Scoped to the only page that reads it. NOTE: every delete of this cookie
    // must pass the same explicit path — a bare cookies().delete(name) emits
    // Path=/ and silently fails to clear a Path=/bekraeft cookie.
    path: CONFIRM_COOKIE_PATH,
    // Short: the cookie only has to survive the hop from this redirect to the
    // button press on the next page. The 7-day life lives in the token itself.
    // It now also survives a successful redemption (the confirm page keeps it),
    // so replays inside these 30 minutes resolve to the honest "already
    // confirmed" answer — the token itself is single-use in the database.
    maxAge: 60 * 30,
  })
  expireLegacyRootCookie(res)
  // A cached 302 + Set-Cookie would hand one person's identity to the next
  // visitor. Vercel's edge caches aggressively; say no explicitly.
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}
