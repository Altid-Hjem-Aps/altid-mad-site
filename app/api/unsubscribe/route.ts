import { NextRequest, NextResponse } from 'next/server'
import { setUnsubscribedByToken } from '@/lib/db'
import { setResendSubscription } from '@/lib/resend'

function page(title: string, body: string, action = '', status = 200) {
  const html = `<!doctype html>
<html lang="da"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Altid Hjem</title>
</head>
<body style="margin:0;background:#f4f4f4;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-height:100vh;">
    <tr><td align="center" valign="middle" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:18px;overflow:hidden;">
        <tr><td style="background:#EDE9DE;padding:24px 28px;">
          <img src="https://www.altidhjem.dk/altid-hjem-logo-dark.svg" alt="Altid Hjem" width="120" height="64" style="display:block;border:0;outline:none;"/>
        </td></tr>
        <tr><td style="padding:36px 32px 40px;">
          <p style="font-size:24px;line-height:1.2;font-weight:800;color:#003c16;margin:0 0 12px;">${title}</p>
          <p style="font-size:16px;line-height:1.6;color:#003c16;margin:0 0 24px;">${body}</p>
          ${action}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

// A POST form button (so state only changes on an explicit click, never on load).
function button(token: string, act: 'unsubscribe' | 'resubscribe', label: string) {
  const url = `/api/unsubscribe?token=${encodeURIComponent(token)}`
  const bg = act === 'unsubscribe' ? '#003c16' : '#aff193'
  const fg = act === 'unsubscribe' ? '#ffffff' : '#003c16'
  return `<form method="POST" action="${url}" style="margin:0;">
    <input type="hidden" name="action" value="${act}"/>
    <button type="submit" style="background:${bg};color:${fg};border:0;border-radius:999px;font-size:16px;font-weight:700;padding:14px 28px;cursor:pointer;font-family:inherit;">${label}</button>
  </form>`
}

// Opening the link only SHOWS a confirmation — it never unsubscribes (so link
// scanners / antivirus that auto-open URLs can't unsubscribe anyone).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  if (!token) return page('Ugyldigt link', 'Linket mangler oplysninger. Prøv at klikke på linket i mailen igen.', '', 400)
  return page(
    'Vil du afmelde dig?',
    'Klik på knappen for at stoppe markedsføringsmails fra Altid Hjem. Du kan altid tilmelde dig igen.',
    button(token, 'unsubscribe', 'Afmeld mig'),
  )
}

// The actual change happens here — on a click (our form) or a one-click POST
// (RFC 8058 List-Unsubscribe-Post from the mail app).
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  if (!token) return new NextResponse(null, { status: 400 })

  let action = 'unsubscribe'
  try {
    const form = await req.formData()
    const a = form.get('action')
    if (a === 'resubscribe') action = 'resubscribe'
  } catch {
    // one-click POSTs may not carry a parseable body — default to unsubscribe
  }

  try {
    const resubscribe = action === 'resubscribe'
    const matched = await setUnsubscribedByToken(token, !resubscribe)
    if (!matched) return page('Vi kunne ikke finde dig', 'Linket er måske udløbet. Skriv til hej@altidhjem.dk hvis du har brug for hjælp.', '', 404)
    if (matched.email) await setResendSubscription(matched.email, !resubscribe) // keep Resend Audience in sync
    return resubscribe
      ? page('Du er tilmeldt igen', 'Du modtager nu igen markedsføringsmails fra Altid Hjem.')
      : page('Du er afmeldt', 'Du modtager ikke flere markedsføringsmails fra Altid Hjem.', button(token, 'resubscribe', 'Fortryd, tilmeld mig igen'))
  } catch (e) {
    console.error('unsubscribe failed', e)
    return page('Noget gik galt', 'Prøv igen om lidt, eller skriv til hej@altidhjem.dk.', '', 500)
  }
}
