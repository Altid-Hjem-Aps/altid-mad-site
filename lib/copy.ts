import { consentSentences, consentVersion } from 'altid-consent'

// Legal/compliance copy that MUST stay identical everywhere it appears.
// Rendered under the Ét hjem animation in both the WhatIs section and the
// exit-intent dialog — an edit to one must never strand the other.
export const SAVINGS_DISCLAIMER =
  'Eksempelberegning. Besparelsen er vejledende og baseret på antagelser. Den faktiske besparelse afhænger af husstandens forbrug, adresse, aftaler, dækning og gældende priser.'

// Marketing consent. The wording, the family of brands and the version are
// decided at Altid Hjem level and live in the altid-consent package: its
// DECISIONS.md says why the box works the way it does, and its CHANGELOG.md
// holds the exact text of every version. Change them there, never here.
//
// Mad-specific, so still here:
// - Altid Mad has no CVR yet; it is a brand run by Altid Hjem ApS (CVR
//   45637476), which is also the sender (the package's senders list names Spari
//   ApS for Altid Mad). WHEN Altid Mad becomes a registered company with its
//   own CVR, revisit a data-sharing agreement between the entities and whether
//   Altid Mad ApS becomes its own sender.
// - CONSENT_VERSION is stored with each signup. The package derives it
//   ('<template>-mad'), so the exact text accepted is identifiable from the
//   version alone on the waitlist shared with altidhjem.dk.
// - 2026-07-14 (legal fact-check): the Altid Mad launch mail IS direct
//   marketing, but the waitlist signup itself is the prior, specific
//   markedsføringslov §10 consent to that one mail (SIGNUP_LAUNCH_NOTICE states
//   the purpose right before the button). That mail may carry ONLY launch/access
//   info: no offers, other brands, or referral push. The launch notice is this
//   site's own text and is not versioned by the package.
// - 2026-10-16 (Alexander Thorup): the narrow and group sentences moved from
//   this site's own long wording to the package's uniform wording, like every
//   other brand (package CHANGELOG, 2026-10-16.2). The confirmation mail,
//   /bekraeft and the preference centre quote them, so a stored
//   2026-10-16.2-mad row is confirmed on the text the package records.
// - SIGNUP_CONSENT_MAD and _GROUP are whole sentences on purpose:
//   emails/consent-confirm.ts quotes one of them as the consent itself, since
//   clicking the link in that mail IS the act of consenting.
const MAD = consentSentences('mad')

export const CONSENT_VERSION = consentVersion('mad')
export const SIGNUP_LAUNCH_NOTICE =
  'Når du skriver dig op, beder du Altid Hjem ApS om at sende dig én e-mail, når Altid Mad er klar. Du kan til enhver tid forlade ventelisten.'
export const SIGNUP_CONSENT_MAD = MAD.own
export const SIGNUP_CONSENT_GROUP = MAD.group

// The waitlist is shared with altidhjem.dk, so a duplicate signup can mean two
// things: they signed up on this site, or they are already on the shared list
// via their Hjem signup. Rows mirrored without a Mad source — including signups
// made before per-source tagging existed — are Hjem signups.
// DUPLICATE_SIGNUP_HEADING is shared with WaitlistForm, which compares the
// API's error text against it to decide whether a longer variant should
// render as the card body — keep it a single constant so a rewording can
// never desync the two.
// NOTE (compliance): we do NOT assert the person is "also on the Altid Mad
// waitlist" — auto-enrolling a Hjem signup into a second brand's marketing is
// not valid consent (Forbrugerombudsmanden requires an active, specific opt-in
// per brand). Cross-brand marketing consent must be an explicit checkbox, once
// the brand-vs-company structure is confirmed and the wording is legally
// approved — see the compliance PR notes. Until then this states the plain fact.
export const DUPLICATE_SIGNUP_HEADING = 'Du er allerede skrevet op!'

export function duplicateSignupMessage(source: string | null | undefined): string {
  return source?.startsWith('altid-mad')
    ? DUPLICATE_SIGNUP_HEADING
    : 'Du er allerede skrevet op til Altid Hjem.'
}

// Double-opt-in copy for an already-listed person who ticks a consent box.
//
// Why any of this exists: the signup form is anonymous, so it cannot prove the
// person typing an address owns it. Writing consent straight from that form
// would let a stranger sign anyone up for marketing, which is why the 409 path
// refuses to (PR #36). But refusing SILENTLY, behind "Du er allerede skrevet
// op", told people they were covered when nothing had been stored — 36 people
// ticked the boxes on 14 Jul and lost them. The confirmation mail is what turns
// the refusal into a route: the consent is held pending until the person clicks
// a link in their own inbox, which is the proof the form could never give.
//
// None of this copy may repeat DUPLICATE_SIGNUP_HEADING's "du er allerede
// skrevet op" — that is the exact sentence that read as "you're covered".
export const CONFIRM_SENT_HEADING = 'Du er næsten i mål'
export function confirmSentBody(email: string): string {
  return `Du står allerede på ventelisten. Vi har sendt en mail til ${email} med et link, som du skal trykke på, før vi må sende dig nyt om Altid Mad.`
}

// The confirm page reached from the emailed link. GET only renders it; the
// consent is written on POST. That split is not optional: corporate mail
// scanners (Safe Links, Proofpoint) auto-open every URL in an email, so a link
// that wrote consent on GET would have the scanner consent on the person's
// behalf, before they ever saw the mail.
export const CONFIRM_PAGE_HEADING = 'Bekræft, at du vil høre nyt om Altid Mad'
// Names the actual two-step interaction: the boxes ship unticked (a pre-ticked
// box is not valid consent), so "press the button" alone described one action
// where two are required.
export const CONFIRM_PAGE_INTRO = 'Sæt kryds ved det, du vil sige ja til, og tryk på knappen:'
export const CONFIRM_PAGE_BUTTON = 'Bekræft'
export const CONFIRM_PAGE_BUTTON_PENDING = 'Bekræfter…'
// Read by screen readers while the submission is in flight (the button itself
// is disabled, which drops focus silently).
export const CONFIRM_PENDING_ANNOUNCE = 'Sender din bekræftelse'
// Inline error when the form is submitted with every box unticked (reachable
// without JavaScript). NOT the expired-link screen: the link is fine.
export const CONFIRM_PICK_ONE = 'Vælg mindst ét samtykke for at fortsætte.'

export const CONFIRM_DONE_HEADING = 'Tak, nu er du med'
export const CONFIRM_DONE_BODY =
  'Du vil fremover høre fra Altid Mad, når vi har nyt til dig. Du kan altid trække dit samtykke tilbage via afmeldingslinket i vores e-mails.'

// A replayed confirmation (double-click, back button, re-clicked email link).
// Speaks about the past act, not the present state: the consent may have been
// revoked since redemption, so "du er med" could be false where "du har
// allerede bekræftet" is always true.
export const CONFIRM_ALREADY_HEADING = 'Du har allerede bekræftet'
export const CONFIRM_ALREADY_BODY =
  'Din bekræftelse er registreret, og du behøver ikke gøre mere. Du kan altid trække dit samtykke tilbage via afmeldingslinket i vores e-mails.'

export const CONFIRM_EXPIRED_HEADING = 'Linket virker desværre ikke længere'
export const CONFIRM_EXPIRED_BODY =
  'Det kan være udløbet eller være blevet ændret undervejs i din mail. Skriv dig op igen, så sender vi dig et nyt link.'

export const CONFIRM_HOME_CTA = 'Gå til altidmad.dk'

export const CONFIRM_RATE_LIMITED_HEADING = 'Vi har allerede sendt dig en mail'
export const CONFIRM_RATE_LIMITED_BODY =
  'Tjek din indbakke, og husk også at kigge i spam. Kan du ikke finde mailen, kan du prøve igen om en time.'

export const ALREADY_CONSENTED_HEADING = 'Du er allerede med'
export const ALREADY_CONSENTED_BODY =
  'Du står på ventelisten og vil modtage nyt om Altid Mad. Du behøver ikke gøre mere.'


// Shown when the lookup that decides the 409 path could not run (Supabase raced
// its 2s timeout). It must NOT fall back to "du er allerede skrevet op" — that is
// the sentence that told 36 people they were covered while their consent was
// dropped. A retryable failure is honest; a reassuring lie is not.
export const LOOKUP_FAILED_ERROR = 'Vi kunne ikke behandle din tilmelding lige nu. Prøv igen om et øjeblik.'

// Ceiling on confirmation mails per hour ACROSS the whole site, not per address.
// The per-address limit alone still lets an attacker with rotating IPs mail every
// non-consenting address on the shared list, one per hour each, from our own
// verified domain.
export const CONFIRM_SENDS_PER_HOUR = 100

// The plain-duplicate message, for someone who ticked nothing.
export const DUPLICATE_ERROR = 'Du er allerede skrevet op til Altid Hjem.'

// Aliases so the confirmation email and confirm page are byte-identical across
// altidmad.dk and altidhjem.dk. Both sites write the SAME two flags to the SAME
// shared row, so the wording shown when confirming or editing a flag must not
// depend on which site the person happens to be looking at. altidhjem.dk quotes
// consentSentences('mad') for the same two flags.
export const PREF_CONSENT_MAD = SIGNUP_CONSENT_MAD
export const PREF_CONSENT_GROUP = SIGNUP_CONSENT_GROUP
