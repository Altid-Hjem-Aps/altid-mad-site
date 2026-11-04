import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// The share card for altidmad.dk. Rendered at build time from files in the repo,
// so a deploy does not depend on a font service. If the font or the logo is
// missing the build fails, so a card in a fallback system font never ships.
//
// app/fonts/Onest-Medium.ttf is the static weight 500 instance of Onest that
// Google Fonts serves (OFL, see app/fonts/OFL.txt). ImageResponse reads ttf, otf
// and woff, not woff2, and renders a variable font at its default weight.

export const alt = 'Altid Mad er klar: madplan og indkøbsliste i appen Altid Hjem'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const [onest, logo] = await Promise.all([
    readFile(join(process.cwd(), 'app/fonts/Onest-Medium.ttf')),
    readFile(join(process.cwd(), 'public/email/mad/altid-mad-logo-white.png')),
  ])
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#3E6924',
          padding: '72px 80px',
          fontFamily: 'Onest',
        }}
      >
        <img src={logoSrc} alt="" width={189} height={100} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 84, lineHeight: 1.08, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Altid Mad er klar.
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.35, color: 'rgba(255,255,255,0.88)', marginTop: 28, maxWidth: 900 }}>
            Madplan og indkøbsliste, der finder de billigste varer i dine butikker.
          </div>
          <div style={{ fontSize: 26, color: '#DCD799', marginTop: 40 }}>Appen Altid Hjem: App Store og Google Play</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Onest', data: onest, style: 'normal', weight: 500 }],
    },
  )
}
