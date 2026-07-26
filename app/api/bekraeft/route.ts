import { NextRequest, NextResponse } from 'next/server'
import { verifyConfirmToken, CONFIRM_COOKIE } from '@/lib/consent-token'

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
export function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  const confirmPage = new URL('/bekraeft', req.nextUrl.origin)

  // Verify before setting anything, so a dead link never plants a cookie.
  const claim = verifyConfirmToken(token, Date.now() / 1000)
  if (!claim) {
    if (token) console.error('api/bekraeft: rejected confirm token — expired, mangled, or wrong key')
    // The page renders the "linket virker ikke længere" state when no valid
    // cookie is present, so send them there rather than to a dead end.
    return NextResponse.redirect(confirmPage, 302)
  }

  const res = NextResponse.redirect(confirmPage, 302)
  res.cookies.set(CONFIRM_COOKIE, token as string, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    // Short: the cookie only has to survive the hop from this redirect to the
    // button press on the next page. The 7-day life lives in the token itself.
    maxAge: 60 * 30,
  })
  // A cached 302 + Set-Cookie would hand one person's identity to the next
  // visitor. Vercel's edge caches aggressively; say no explicitly.
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}
