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
