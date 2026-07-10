// Legal/compliance copy that MUST stay identical everywhere it appears.
// Rendered under the Ét hjem animation in both the WhatIs section and the
// exit-intent dialog — an edit to one must never strand the other.
export const SAVINGS_DISCLAIMER =
  'Eksempelberegning. Besparelsen er vejledende og baseret på antagelser. Den faktiske besparelse afhænger af husstandens forbrug, adresse, aftaler, dækning og gældende priser.'

// The waitlist is shared with altidhjem.dk, so a duplicate signup can mean two
// things: they signed up on this site, or they are already covered via their
// Hjem signup. Rows mirrored without a Mad source — including signups made
// before per-source tagging existed — are Hjem signups.
// DUPLICATE_SIGNUP_HEADING is shared with WaitlistForm, which compares the
// API's error text against it to decide whether a longer variant should
// render as the card body — keep it a single constant so a rewording can
// never desync the two.
export const DUPLICATE_SIGNUP_HEADING = 'Du er allerede skrevet op!'

export function duplicateSignupMessage(source: string | null | undefined): string {
  return source?.startsWith('altid-mad')
    ? DUPLICATE_SIGNUP_HEADING
    : 'Du er allerede skrevet op til Altid Hjem og står derfor også på ventelisten til Altid Mad.'
}
