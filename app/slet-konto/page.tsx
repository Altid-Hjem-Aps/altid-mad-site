import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Slet din konto – Altid Mad',
  description: 'Sådan sletter du din Altid Hjem-konto, og hvad der sker med dine data.',
}

export default function SletKonto() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-28 pb-24" style={{ background: 'var(--forest)', fontFamily: 'var(--font-onest)' }}>
        <div className="max-w-2xl mx-auto px-6">

          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-10 text-white/55 transition-colors hover:text-white/85">
            <span aria-hidden="true">←</span> Tilbage
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Slet din Altid Hjem-konto</h1>
          <p className="text-sm mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Altid Hjem ApS · CVR 45637476 · hej@altidhjem.dk</p>
          <p className="text-xs mb-12" style={{ color: 'rgba(255,255,255,0.55)' }}>Senest opdateret: juni 2026</p>

          <div className="space-y-10 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>

            <section>
              <p>På denne side kan du læse, hvordan du sletter din Altid Hjem-konto, og hvad der sker med dine data, når kontoen slettes.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">Sådan sletter du din konto</h2>
              <p className="mb-3">Send en e-mail til <a href="mailto:hej@altidhjem.dk?subject=Slet%20min%20konto" className="underline underline-offset-2 text-white transition-colors hover:text-white/80">hej@altidhjem.dk</a> med emnet <span className="font-medium text-white">&ldquo;Slet min konto&rdquo;</span> fra den e-mailadresse, din konto er oprettet med. Som sikkerhed sender vi en bekræftelse til din kontos e-mailadresse, og sletningen gennemføres først, når du har bekræftet. Din konto slettes herefter inden for 30 dage.</p>
              <p>Vi arbejder på, at du snart kan slette din konto direkte i appen under <span className="font-medium text-white">Profil → Slet konto</span>. Denne side bliver opdateret, når funktionen er klar.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">Hvad bliver slettet</h2>
              <p className="mb-3">Når din konto slettes, fjerner vi din profil og dine kontaktoplysninger, dine app-data og dit login.</p>
              <p>Oplysninger, som vi er retligt forpligtede til at opbevare – fx bogføringsmateriale efter bogføringsloven samt aftale- og betalingshistorik – opbevares i op til 5 år efter kundeforholdets ophør og slettes derefter. Du kan læse mere i vores <Link href="/privatlivspolitik" className="underline underline-offset-2 text-white transition-colors hover:text-white/80">privatlivspolitik</Link>.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">Kontakt</h2>
              <div className="pl-4" style={{ borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                <p className="font-medium text-white">Altid Hjem ApS</p>
                <p>CVR 45637476</p>
                <p>c/o Mad House HQ ApS</p>
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
