// Legal/compliance copy that MUST stay identical everywhere it appears.
// Rendered under the Ét hjem animation in both the WhatIs section and the
// exit-intent dialog — an edit to one must never strand the other.
export const SAVINGS_DISCLAIMER =
  'Eksempelberegning. Besparelsen er vejledende og baseret på antagelser. Den faktiske besparelse afhænger af husstandens forbrug, adresse, aftaler, dækning og gældende priser.'

// Marketing-consent copy for the two signup checkboxes. Verbatim from the
// legal fact-check (based on Forbrugerombudsmanden's spam guidance): active,
// non-pre-checked, exhaustively names each brand, and says it is marketing.
// Present structure: Altid Mad has no CVR yet, so it is a brand run by Altid
// Hjem ApS (CVR 45637476), which is also the sender — hence "fra Altid Hjem
// ApS". WHEN Altid Mad becomes a registered company with its own CVR, revisit:
// a data-sharing agreement between the entities and possibly naming Altid Mad
// ApS as its own sender. CONSENT_VERSION is stored with each signup; the site
// suffix ('-mad', vs the altidhjem.dk '-hjem') makes it self-documenting on the
// SHARED waitlist, since the two sites use different wording — the exact text
// accepted is identifiable from the version alone, not only via signup_source.
// Bumped from 2026-07-13 when the wording softened to "vil gerne modtage" —
// consent_version stores the exact text accepted, so a wording change bumps it.
// 2026-07-14 (legal fact-check): the Altid Mad launch mail IS direct marketing,
// but the waitlist signup itself is the prior, specific markedsføringslov §10
// consent to that one mail — the purpose is stated right before the button in
// SIGNUP_LAUNCH_NOTICE. That mail may carry ONLY launch/access info: no offers,
// other brands, or referral push. "lanceringer" is therefore dropped from the
// Mad box (its launch is covered by signing up) but KEPT in the group box (a
// Mad signer never asked about the other brands' launches). Both boxes stay
// optional and independent of joining the waitlist.
export const CONSENT_VERSION = '2026-07-14.2-mad'
export const SIGNUP_LAUNCH_NOTICE =
  'Når du skriver dig op, beder du Altid Hjem ApS om at sende dig én e-mail, når Altid Mad er klar. Du kan til enhver tid forlade ventelisten.'
export const SIGNUP_CONSENT_MAD =
  'Ja tak. Jeg vil gerne modtage e-mails med nyheder, tilbud og anden markedsføring om Altid Mad fra Altid Hjem ApS. Jeg kan til enhver tid trække mit samtykke tilbage.'
export const SIGNUP_CONSENT_GROUP =
  'Ja tak. Jeg vil gerne modtage e-mails med nyheder, lanceringer, tilbud og anden markedsføring om Altid Hjem, Altid Forsikring og Altid Mobil fra Altid Hjem ApS. Jeg kan til enhver tid trække mit samtykke tilbage.'

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
export const CONFIRM_PAGE_INTRO = 'Når du trykker på knappen, bekræfter du følgende:'
export const CONFIRM_PAGE_BUTTON = 'Bekræft'

export const CONFIRM_DONE_HEADING = 'Tak, nu er du med'
export const CONFIRM_DONE_BODY =
  'Du vil fremover høre fra Altid Mad, når vi har nyt til dig. Du kan altid trække dit samtykke tilbage via afmeldingslinket i vores e-mails.'

export const CONFIRM_EXPIRED_HEADING = 'Linket virker desværre ikke længere'
export const CONFIRM_EXPIRED_BODY =
  'Det kan være udløbet eller være blevet ændret undervejs i din mail. Skriv dig op igen, så sender vi dig et nyt link.'

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
// altidmad.dk and altidhjem.dk. The two sites collect consent with different
// forms (Mad has two boxes, Hjem one combined box) but they write the SAME two
// flags to the SAME shared row — so the wording shown when confirming or editing
// a flag must not depend on which site the person happens to be looking at.
export const PREF_CONSENT_MAD = SIGNUP_CONSENT_MAD
export const PREF_CONSENT_GROUP = SIGNUP_CONSENT_GROUP
