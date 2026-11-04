import type { Metadata } from 'next'
import InviterShare from '@/components/InviterShare'

export const metadata: Metadata = {
  title: 'Inviter venner: Altid Mad',
  description: 'Del dit personlige link, så dine venner også kan finde Altid Mad.',
  openGraph: {
    title: 'Kom med på Altid Mad',
    description: 'Bedre råd til mad. Altid Mad finder du i appen Altid Hjem.',
    url: 'https://altidmad.dk/inviter',
    siteName: 'Altid Mad',
    type: 'website',
  },
}

// The icons of the services in the app, from the email templates' assets.
const CATEGORY_ICONS: [string, string][] = [
  ['icon-strom', 'Energi'],
  ['icon-mad', 'Mad'],
  ['icon-forsikring', 'Forsikring'],
]

export default async function InviterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  return (
    <main
      style={{
        background: '#fdfaf4',
        minHeight: '100vh',
        fontFamily: 'var(--font-onest), "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Header — matches the email templates: dark-green bar + white Mad logo */}
      <header style={{ background: '#163223' }}>
        <div className="mx-auto flex max-w-xl items-center justify-between px-6 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/email/mad/altid-mad-logo-white.png"
            alt="Altid Mad"
            width={88}
            height={47}
            style={{ display: 'block' }}
          />
          <div className="hidden items-center gap-1.5 sm:flex">
            {CATEGORY_ICONS.map(([file, alt]) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={file}
                src={`/email/mad/${file}.svg`}
                alt={alt}
                width={34}
                height={34}
                style={{ display: 'inline-block' }}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="px-6 py-12 sm:py-16">
        <InviterShare code={ref ?? ''} />
      </div>
    </main>
  )
}
