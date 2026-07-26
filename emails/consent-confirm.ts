import { PREF_CONSENT_MAD, PREF_CONSENT_GROUP } from '@/lib/copy'

export type ConsentSet = { mad: boolean; group: boolean }

export const CONSENT_CONFIRM_SUBJECT = 'Bekræft, at du vil høre nyt fra Altid'
const PREHEADER = 'Ét klik, så er du med.'

/**
 * The double-opt-in confirmation mail.
 *
 * It must stay BARE. It is lawful because it confirms a request the recipient
 * made seconds earlier — a service message, not marketing. The moment it carries
 * an offer, a referral CTA, product imagery, or a brand it was not asked about,
 * it becomes marketing sent to an address whose consent we do not yet hold, which
 * is the exact thing it exists to avoid. Never reuse a referral template here:
 * they carry an invite CTA.
 *
 * It names ONLY what the person actually ticked and does not already hold. An
 * email that OFFERS a consent they did not ask for is soliciting new consent by
 * mail, and that is marketing.
 *
 * The consent wording is quoted verbatim from lib/copy.ts. That quote IS the
 * evidence of what they agreed to; never paraphrase it to fit the layout.
 *
 * Identical in both repos, deliberately: one shared waitlist row should not look
 * like two companies depending on which site the person signed up from.
 */
export function consentTextsFor(pending: ConsentSet): string[] {
  return [...(pending.mad ? [PREF_CONSENT_MAD] : []), ...(pending.group ? [PREF_CONSENT_GROUP] : [])]
}

export function confirmHeading(pending: ConsentSet): string {
  if (pending.mad && pending.group) return 'Vil du høre nyt fra Altid?'
  if (pending.group) return 'Vil du høre nyt fra Altid Hjem, Altid Forsikring og Altid Mobil?'
  return 'Vil du høre nyt om Altid Mad?'
}

export function confirmIntro(pending: ConsentSet): string {
  if (pending.mad && pending.group)
    return 'Du står allerede på ventelisten og har netop bedt om at høre nyt fra Altid Mad og de øvrige Altid-brands.'
  if (pending.group)
    return 'Du står allerede på ventelisten og har netop bedt om at høre nyt fra de øvrige Altid-brands.'
  return 'Du står allerede på ventelisten og har netop bedt om også at høre nyt om Altid Mad.'
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// DESIGN.md palette (lib/brand.ts), inlined because email cannot use CSS vars.
export function renderConsentConfirmEmail(vars: {
  firstName: string
  confirmUrl: string
  unsubscribeUrl: string
  pending: ConsentSet
}): string {
  const { firstName, confirmUrl, unsubscribeUrl, pending } = vars
  const texts = consentTextsFor(pending)
  const plural = texts.length > 1 ? 'bekræfter du følgende <strong>to</strong> ting:' : 'bekræfter du følgende:'

  const quotes = texts
    .map(
      (t) =>
        `<p style="margin:0 0 12px;padding:12px 16px;border-left:3px solid #163223;background:#E6E2D8;font-style:italic;color:#6F6A61;font-size:14px;line-height:1.5;">&ldquo;${escapeHtml(t)}&rdquo;</p>`,
    )
    .join('')

  return `<!doctype html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(CONSENT_CONFIRM_SUBJECT)}</title>
</head>
<body style="margin:0;padding:0;background:#FDFAF4;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(PREHEADER)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FDFAF4;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;background:#ffffff;border-radius:20px;">
<tr><td style="padding:36px 32px;font-family:'Onest','Helvetica Neue',Arial,sans-serif;color:#163223;">

<h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;font-weight:500;color:#163223;">${escapeHtml(confirmHeading(pending))}</h1>

<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#6F6A61;">Hej ${escapeHtml(firstName)}</p>
<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#6F6A61;">${escapeHtml(confirmIntro(pending))}</p>
<p style="margin:0 0 28px;font-size:16px;line-height:1.55;color:#6F6A61;">Tryk på knappen nedenfor, så sørger vi for resten.</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
<tbody><tr>
<td bgcolor="#90FF7C" align="center" valign="middle" width="220" height="52" style="background-color:#90FF7C;width:220px;height:52px;border-radius:20px;text-align:center;vertical-align:middle;">
<a href="${escapeHtml(confirmUrl)}" target="_blank" style="display:block;font-family:'Onest','Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:500;line-height:52px;color:#163223;text-decoration:none;text-align:center;">Ja tak, bekræft</a>
</td>
</tr></tbody>
</table>

<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#6F6A61;">Når du trykker på knappen, ${plural}</p>
${quotes}

<p style="margin:20px 0 0;font-size:14px;line-height:1.55;color:#6F6A61;">Har du ikke selv bedt om det, behøver du ikke gøre noget. Så sker der ingenting.</p>

</td></tr>
<tr><td style="padding:0 32px 32px;font-family:'Onest','Helvetica Neue',Arial,sans-serif;">
<p style="margin:0;font-size:12px;line-height:1.5;color:#6F6A61;">
Altid Hjem ApS, CVR 45637476.
<a href="${escapeHtml(unsubscribeUrl)}" style="color:#6F6A61;text-decoration:underline;">Afmeld</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}
