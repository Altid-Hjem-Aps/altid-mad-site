import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Presse – Altid Mad',
  description:
    'Pressemateriale for Altid Mad: pressebilleder til fri redaktionel brug, Q3-rapporten bag besparelsestallene og pressekontakt.',
}

// Photographer credit is a usage condition, not decoration — it must survive
// any future redesign of this page.
const PHOTOGRAPHER = 'Frank Lohmann'

type Photo = {
  slug: string
  alt: string
  webMb: string
  trykMb?: string
}

const PHOTOS: Photo[] = [
  { slug: 'altid-mad-pressefoto-1', alt: 'Werner Valeur, stifter af Altid Mad', webMb: '0,9 MB', trykMb: '26 MB' },
  { slug: 'altid-mad-pressefoto-2', alt: 'Werner Valeur, stifter af Altid Mad', webMb: '0,8 MB', trykMb: '23 MB' },
  { slug: 'altid-mad-pressefoto-3', alt: 'Werner Valeur, stifter af Altid Mad', webMb: '0,9 MB' },
  { slug: 'altid-mad-pressefoto-4', alt: 'Werner Valeur, stifter af Altid Mad', webMb: '1,0 MB' },
  { slug: 'altid-mad-pressefoto-5', alt: 'Werner Valeur, stifter af Altid Mad', webMb: '0,3 MB', trykMb: '25 MB' },
]

const linkCls =
  'inline-flex items-center justify-center rounded-full px-4 py-2 text-[13px] font-medium transition-opacity hover:opacity-80'

export default function Presse() {
  return (
    <>
      <Nav />
      <main
        className="min-h-screen pt-28 pb-24"
        style={{ background: '#fdfaf4', fontFamily: 'var(--font-onest)', color: '#163223' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm mb-10 transition-opacity hover:opacity-70"
            style={{ color: '#6f6a61' }}
          >
            <span aria-hidden="true">←</span> Tilbage
          </Link>

          <h1 className="text-3xl sm:text-4xl font-normal mb-3">Presse</h1>
          <p className="text-base leading-relaxed mb-2 max-w-2xl" style={{ color: '#6f6a61' }}>
            Pressebilleder til fri redaktionel brug. Kreditering: <strong style={{ color: '#163223' }}>Fotograf: {PHOTOGRAPHER}</strong>.
          </p>
          <p className="text-sm leading-relaxed mb-12 max-w-2xl" style={{ color: '#6f6a61' }}>
            Hvert billede kan hentes enkeltvis i webopløsning eller høj opløsning til tryk.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {PHOTOS.map(photo => (
              <figure key={photo.slug} className="flex flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/presse/${photo.slug}-web.jpg`}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto rounded-2xl mb-4"
                />
                <figcaption className="text-[13px] mb-3" style={{ color: '#6f6a61' }}>
                  {photo.alt}. Foto: {PHOTOGRAPHER}.
                </figcaption>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/presse/${photo.slug}-web.jpg`}
                    download
                    className={linkCls}
                    style={{ background: '#DCD799', color: '#163223' }}
                  >
                    Download web ({photo.webMb})
                  </a>
                  {photo.trykMb && (
                    <a
                      href={`/presse/${photo.slug}-tryk.jpg`}
                      download
                      className={linkCls}
                      style={{ background: '#163223', color: '#fdfaf4' }}
                    >
                      Download tryk ({photo.trykMb})
                    </a>
                  )}
                </div>
              </figure>
            ))}
          </div>

          <section className="max-w-2xl">
            <h2 className="text-xl font-medium mb-4">Dokumentation og omtale</h2>
            <ul className="space-y-2 text-sm" style={{ color: '#6f6a61' }}>
              <li>
                <a
                  href="https://altidmad.dk/altid-mad-kvartalsrapport-q3.pdf"
                  className="underline underline-offset-2"
                  style={{ color: '#163223' }}
                >
                  Q3-rapporten
                </a>{' '}
                — beregningerne bag besparelsestallene.
              </li>
              <li>
                <a
                  href="https://ekstrabladet.dk/forbrug/Teknologi/spar-stort-paa-dine-dagligvarer-ny-app-sammenligner-priser/11232767"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                  style={{ color: '#163223' }}
                >
                  Ekstra Bladet: &quot;Spar stort på dine dagligvarer: Ny app sammenligner priser&quot;
                </a>{' '}
                (26. juli 2026).
              </li>
            </ul>
            <h2 className="text-xl font-medium mt-10 mb-3">Pressekontakt</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#6f6a61' }}>
              Thor Jekes —{' '}
              <a href="mailto:t@altidhjem.dk" className="underline underline-offset-2" style={{ color: '#163223' }}>
                t@altidhjem.dk
              </a>
              <br />
              Werner Valeur er tilgængelig for interview —{' '}
              <a href="mailto:w@madhousehq.com" className="underline underline-offset-2" style={{ color: '#163223' }}>
                w@madhousehq.com
              </a>{' '}
              · 31 31 00 04
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
