import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Support – Altid Hjem',
  description: 'Har du brug for hjælp til Altid Hjem-appen? Skriv til os på hej@altidhjem.dk, så vender vi tilbage hurtigst muligt.',
}

const energiLink = (
  <a href="https://altidenergi.dk" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-colors hover:text-white">altidenergi.dk</a>
)

const faq = [
  {
    q: 'Jeg kan ikke logge ind',
    a: <>Har du problemer med at logge ind, så skriv til os på <a href="mailto:hej@altidhjem.dk" className="underline underline-offset-2 transition-colors hover:text-white">hej@altidhjem.dk</a> – så hjælper vi dig videre.</>,
  },
  {
    q: 'Spørgsmål til elforbrug og priser',
    a: <>Dit elforbrug og dine elpriser hører under Altid Energi. Du finder hjælp og kontakt på {energiLink}.</>,
  },
  {
    q: 'Spørgsmål til opladning',
    a: <>Spørgsmål til opladning hører under Altid Energi. Du finder hjælp og kontakt på {energiLink}.</>,
  },
]

export default function Kontakt() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-28 pb-24" style={{ background: 'var(--forest)', fontFamily: 'var(--font-onest)' }}>
        <div className="max-w-2xl mx-auto px-6">

          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-10 text-white/55 transition-colors hover:text-white/85">
            <span aria-hidden="true">←</span> Tilbage
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Support</h1>
          <p className="text-sm mb-12 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Altid Hjem ApS · CVR 45637476 · hej@altidhjem.dk</p>

          <div className="space-y-10 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>

            <section>
              <p className="text-base mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>Har du brug for hjælp til Altid Hjem-appen? Vi er her for dig.</p>
              <p className="mb-3">Skriv til os på <a href="mailto:hej@altidhjem.dk" className="underline underline-offset-2 text-white transition-colors hover:text-white/80">hej@altidhjem.dk</a>, så vender vi tilbage hurtigst muligt.</p>
              <p>Du kan også læse mere om Altid Hjem på <a href="https://altidhjem.dk" className="underline underline-offset-2 transition-colors hover:text-white">altidhjem.dk</a>.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-4">Ofte stillede spørgsmål</h2>
              <div className="space-y-6">
                {faq.map(({ q, a }) => (
                  <div key={q}>
                    <p className="font-semibold text-white mb-1">{q}</p>
                    <p>{a}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">Kontakt</h2>
              <div className="pl-4" style={{ borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                <p className="font-medium text-white">Altid Hjem ApS</p>
                <p>CVR 45637476</p>
                <p>Helsinkigade 29, 2150 Nordhavn</p>
                <p><a href="mailto:hej@altidhjem.dk" className="underline underline-offset-2 transition-colors hover:text-white">hej@altidhjem.dk</a></p>
              </div>
            </section>

          </div>
        </div>
      </main>
    </>
  )
}
