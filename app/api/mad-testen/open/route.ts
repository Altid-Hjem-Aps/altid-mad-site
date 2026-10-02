import { NextRequest, NextResponse } from 'next/server'
import { recordMadTestPageOpen } from '@/lib/db'
import { isMadTestPage } from '@/lib/mad-test'
import { eligibleSignup, tester } from '@/lib/mad-test-access'

// Mad-testen page opens (ALT-345). The yes-page's asking screens and the survey
// form send one beacon here when a real browser shows them (reportOpen in
// lib/mad-test.ts): POST ?t=<unsub_token>, the same token and query the page's
// own form action carries, with the body page=optin or page=survey
// (application/x-www-form-urlencoded). A GET writes nothing anywhere, so a mail
// scanner that fetches the links is never counted.
//
// The token is checked exactly as the page itself checks it
// (lib/mad-test-access.ts): an 'optin' open needs the yes-page's audience, a
// 'survey' open a tester. One row per person and page; a later open keeps the
// first time.
//
// The page never waits for this answer, so it carries no screen: 204 when the
// row is written (or was already there), 400 when the request is refused, 500
// when the database fails. Refusals and failures are logged, without the token.

function status(code: 204 | 400 | 500) {
  return new NextResponse(null, { status: code, headers: { 'Cache-Control': 'private, no-store' } })
}

function refused(reason: string) {
  console.warn(`mad-testen open refused: ${reason}`)
  return status(400)
}

export async function POST(req: NextRequest) {
  try {
    // A body that is not form data at all (JSON, text/plain, no content type)
    // makes formData() throw; that is a refusal, not a server error.
    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return refused('body is not form data')
    }
    // The beacon sends page once, as text. Anything else is a hand-made request.
    const pages = form.getAll('page')
    const page = pages.length === 1 ? pages[0] : null
    if (!isMadTestPage(page)) return refused('page is not optin or survey')

    const found = page === 'survey' ? await tester(req) : await eligibleSignup(req)
    if (!found) return refused(`not a Mad-testen link for page ${page}`)

    await recordMadTestPageOpen(found.signup.publicId, page)
    return status(204)
  } catch (e) {
    console.error('mad-testen open POST failed', e)
    return status(500)
  }
}
