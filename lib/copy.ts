import { consentSentences, consentVersion } from 'altid-consent'

// Legal/compliance copy that MUST stay identical everywhere it appears.
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
//   version alone on the signup table shared with altidhjem.dk.
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
export const SIGNUP_CONSENT_MAD = MAD.own
export const SIGNUP_CONSENT_GROUP = MAD.group

// Double-opt-in copy. The newsletter form is anonymous, so it cannot prove the
// person typing an address owns it, and writing consent straight from it would
// let a stranger sign anyone up for marketing. The confirmation mail is the route:
// the consent is held pending until the person clicks a link in their own inbox.
//
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
  'Det kan være udløbet eller være blevet ændret undervejs i din mail. Tilmeld dig igen på altidmad.dk, så sender vi dig et nyt link.'

export const CONFIRM_HOME_CTA = 'Gå til altidmad.dk'

// Shown when the lookup that decides what to do with an address could not run
// (Supabase raced its 2s timeout). A retryable failure is honest; telling people
// they are covered while their consent was dropped is what happened on 14 Jul.
export const LOOKUP_FAILED_ERROR = 'Vi kunne ikke behandle din tilmelding lige nu. Prøv igen om et øjeblik.'

// Ceiling on confirmation mails per hour ACROSS the whole site, not per address.
// The per-address limit alone still lets an attacker with rotating IPs mail every
// non-consenting address on the shared table, one per hour each, from our own
// verified domain.
export const CONFIRM_SENDS_PER_HOUR = 100

// Aliases so the confirmation email and confirm page are byte-identical across
// altidmad.dk and altidhjem.dk. Both sites write the SAME two flags to the SAME
// shared row, so the wording shown when confirming or editing a flag must not
// depend on which site the person happens to be looking at. altidhjem.dk quotes
// consentSentences('mad') for the same two flags.
export const PREF_CONSENT_MAD = SIGNUP_CONSENT_MAD
export const PREF_CONSENT_GROUP = SIGNUP_CONSENT_GROUP

// The newsletter signup (ALT-895). The consent sentence and heading are ALT-895's
// exact words. They live here, outside the altid-consent package, because the
// issue prescribes them; the version is stamped by the server (lib/newsletter.ts),
// so the stored row names this exact text. Change the sentence, bump the version.
export const NEWSLETTER_CONSENT_VERSION = 'newsletter-2026-11-04-mad'
export const NEWSLETTER_HEADING = 'Få nyheder fra Altid Mad'
export const NEWSLETTER_CONSENT =
  'Jeg vil gerne modtage nyheder, tilbud og anden markedsføring om Altid Mad fra Altid Hjem ApS på e-mail. Jeg kan altid afmelde mig.'
export const NEWSLETTER_EMAIL_LABEL = 'E-mail'
export const NEWSLETTER_BUTTON = 'Tilmeld'
export const NEWSLETTER_BUTTON_PENDING = 'Tilmelder…'
export const NEWSLETTER_SUCCESS = 'Tak. Du hører fra os.'
export const NEWSLETTER_ERROR_EMAIL = 'Skriv en gyldig e-mailadresse.'
export const NEWSLETTER_ERROR_CONSENT = 'Sæt kryds i feltet for at tilmelde dig.'
export const NEWSLETTER_ERROR_RATE_LIMITED = 'For mange forsøg. Prøv igen om en time.'
export const NEWSLETTER_ERROR_RETRY = 'Vi kunne ikke tilmelde dig lige nu. Prøv igen om et øjeblik.'
export const NEWSLETTER_ERROR_NETWORK = 'Noget gik galt. Tjek din forbindelse, og prøv igen.'
