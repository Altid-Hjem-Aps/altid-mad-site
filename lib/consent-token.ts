import crypto from 'crypto'

// Proves two things about a pending consent, so the confirmation link in the
// email can be trusted: WHO it belongs to, and WHAT they actually ticked.
//
// Binding the consent set into the signature is the point. If the token only
// named the person, the confirm page would have to take the set from a form
// field or a query param, both attacker-controlled — anyone holding the link
// (the person, a forwarded mail, a mail scanner's log) could confirm MORE than
// was ticked, e.g. escalate a Mad-only tick into Mad + group. The stored
// consent record would then be a signed claim about a set nothing vouches for.
//
// Expiry is part of the signature too: a link that never dies degrades
// "possession of the mail we just sent" into "possession of any mail we ever
// sent".
//
// Format: <base64url(payload)>.<hmac>, payload = "<public_id>:<mad><group>:<exp>"
// e.g. "a1b2…:10:1784668800" = Mad ticked, group not, valid until that unix ts.

const CONFIRM_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

// Set by /api/bekraeft when the emailed link is opened; read by the confirm page
// and its POST. The token never goes in a page URL: Amplitude autocapture runs
// with pageViews + pageUrlEnrichment, so a token in the address bar would be
// shipped to Amplitude with every page view, and it would sit in browser history
// and referrer headers too.
export const CONFIRM_COOKIE = 'am_confirm'

export type ConsentSet = { mad: boolean; group: boolean }

// A dedicated secret, NOT the Supabase service-role key. Signing consent with
// the database god-credential means anyone who can read that key can forge a
// consent record, and it makes the key un-rotatable: rotating it after a leak
// would silently kill every live confirmation link.
function secret(): string {
  const key = process.env.CONSENT_TOKEN_SECRET
  if (!key) throw new Error('consent-token: CONSENT_TOKEN_SECRET must be set')
  return key
}

// Lets callers fail fast before doing work that assumes tokens are usable.
export function assertConsentTokenConfigured(): void {
  secret()
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(`confirm:${payload}`).digest('base64url')
}

/** Mint the token that goes in the confirmation email. */
export function signConfirmToken(publicId: string, consent: ConsentSet, nowSeconds: number): string {
  const exp = Math.floor(nowSeconds) + CONFIRM_TTL_SECONDS
  const payload = `${publicId}:${consent.mad ? 1 : 0}${consent.group ? 1 : 0}:${exp}`
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`
}

export type ConfirmClaim = { publicId: string; consent: ConsentSet }

/**
 * What the person may actually be granted: what they ticked on the confirm page,
 * INTERSECTED with what the signed token says they asked for on the site.
 *
 * The intersection is the security boundary. The confirm page's checkboxes are a
 * form, and a form can be tampered with — so the submission may only ever NARROW
 * the token's set, never widen it. Unticking is a legitimate downgrade; adding a
 * consent the token does not carry is an escalation, and it is refused here.
 */
export function grantedConsent(claim: ConfirmClaim, submitted: Iterable<string>): ConsentSet {
  const ticked = new Set(Array.from(submitted, String))
  return {
    mad: claim.consent.mad && ticked.has('mad'),
    group: claim.consent.group && ticked.has('group'),
  }
}

/**
 * Returns what the token vouches for, or null if it is malformed, tampered
 * with, signed with a different key, or expired. Never throws on bad input — a
 * mangled link from a mail client is a user event, not a server fault.
 */
export function verifyConfirmToken(token: string | undefined | null, nowSeconds: number): ConfirmClaim | null {
  if (!token) return null
  const raw = String(token)
  const dot = raw.lastIndexOf('.')
  if (dot <= 0 || dot === raw.length - 1) return null

  let payload: string
  try {
    payload = Buffer.from(raw.slice(0, dot), 'base64url').toString()
  } catch {
    return null
  }

  const given = Buffer.from(raw.slice(dot + 1))
  const expected = Buffer.from(sign(payload))
  if (expected.length !== given.length) return null
  if (!crypto.timingSafeEqual(expected, given)) return null

  // Only parse AFTER the signature checks out, so a forged payload never
  // reaches the parser.
  const parts = payload.split(':')
  if (parts.length !== 3) return null
  const [publicId, flags, expRaw] = parts
  if (!publicId || !/^[01]{2}$/.test(flags)) return null

  const exp = Number(expRaw)
  if (!Number.isFinite(exp) || exp <= Math.floor(nowSeconds)) return null

  const consent = { mad: flags[0] === '1', group: flags[1] === '1' }
  // A token that grants nothing is meaningless; refuse it rather than write an
  // empty consent record.
  if (!consent.mad && !consent.group) return null

  return { publicId, consent }
}


/**
 * Stable id for a confirmation token, used as the single-use key in
 * consent_event. Hashed, so the raw token (which is a bearer credential) never
 * lands in the audit table.
 */
export function tokenId(token: string): string {
  return crypto.createHash('sha256').update(String(token)).digest('base64url')
}
