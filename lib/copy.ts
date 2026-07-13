// Legal/compliance copy that MUST stay identical everywhere it appears.
// Rendered under the Ét hjem animation in both the WhatIs section and the
// exit-intent dialog — an edit to one must never strand the other.
export const SAVINGS_DISCLAIMER =
  'Eksempelberegning. Besparelsen er vejledende og baseret på antagelser. Den faktiske besparelse afhænger af husstandens forbrug, adresse, aftaler, dækning og gældende priser.'

// Signup consent (marketing-permission text under every waitlist form).
// Establishes the ONE-SHARED-LIST model: signing up to any Altid property
// enrols you across Altid Hjem and its services, with easy one-click opt-out.
// This is the consent basis that makes the cross-brand duplicate message and
// cross-brand emails legitimate for NEW signups — it does NOT retroactively
// cover people who signed up under the old "Ingen spam / Altid Hjem only"
// text, and the exact wording needs legal/DPO sign-off before it is relied on.
export const SIGNUP_CONSENT =
  'Ved at skrive dig op giver du samtykke til, at Altid Hjem ApS må sende dig e-mails om Altid Hjem og alle Altid-tjenester – herunder Altid Mad, Altid Forsikring og Altid Mobil. Du kommer på den fælles venteliste til dem alle og kan til enhver tid afmelde med ét klik.'

// Duplicate signup on the shared list. Per the one-list model above, a Hjem
// signup is also on the Altid Mad list, so we say so. Kept accurate to whatever
// SIGNUP_CONSENT establishes. DUPLICATE_SIGNUP_HEADING is shared with
// WaitlistForm, which compares the API's error text against it to decide
// whether a longer variant renders as the card body — keep it one constant.
export const DUPLICATE_SIGNUP_HEADING = 'Du er allerede skrevet op!'

export function duplicateSignupMessage(source: string | null | undefined): string {
  return source?.startsWith('altid-mad')
    ? DUPLICATE_SIGNUP_HEADING
    : 'Du er allerede skrevet op til Altid Hjem og dermed også til Altid Mad.'
}
