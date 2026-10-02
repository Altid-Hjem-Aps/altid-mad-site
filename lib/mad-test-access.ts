import type { NextRequest } from 'next/server'
import { getMadTestOptin, getSignupByUnsubToken } from '@/lib/db'
import { isMadTestEligible } from '@/lib/mad-test'

/**
 * Who a Mad-testen link (ALT-345) belongs to. Every Mad-testen route reads the
 * person's unsub_token from ?t= and checks it here, so the yes-page, the
 * survey and the page-open record refuse exactly the same links.
 *
 * Both return null for every reason a link is refused, never which one: the
 * routes answer them all alike, so no response tells who is on the list or in
 * the test. Database errors throw.
 */

// signup.unsub_token is a Postgres uuid column. Anything else never reaches the
// database: PostgREST answers a non-uuid filter with 22P02, which would turn a
// mangled link into a 500 instead of the invalid-link screen.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The yes-page's audience: an active altidmad.dk signup with Altid Mad consent. */
export async function eligibleSignup(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get('t') ?? '').trim()
  if (!UUID.test(token)) return null
  const signup = await getSignupByUnsubToken(token)
  if (!signup || !isMadTestEligible(signup)) return null
  return { token, signup }
}

/** The survey's audience: an eligible signup that said yes to the test (a mad_test_optin row). */
export async function tester(req: NextRequest) {
  const found = await eligibleSignup(req)
  if (!found) return null
  if (!(await getMadTestOptin(found.signup.publicId))) return null
  return found
}
