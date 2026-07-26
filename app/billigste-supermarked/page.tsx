import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import PristjekMockup from '@/components/PristjekMockup'
import BottomCta from '@/components/sections/BottomCta'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Billigste supermarked 2026, se pristjek – Altid Mad',
  description:
    'Se hvilket supermarked der var billigst i vores pristjek, hvad en familie kan spare, og hvordan du selv handler billigere. Læs analysen hos Altid Mad.',
}

// FAQ copy is used twice: rendered on the page AND serialized as FAQPage
// schema (rich results). Keep the two in sync by editing only this array.
const FAQ: { q: string; a: string[] }[] = [
  {
    q: 'Hvilket supermarked er billigst i Danmark?',
    a: [
      'Rema 1000 var billigst for hele varekurven i vores Q2-analyse.',
      'Resultatet er et øjebliksbillede, fordi priser, tilbud og familiers indkøb varierer.',
    ],
  },
  {
    q: 'Er discountbutikker altid billigst?',
    a: [
      'Nej, discountbutikker er ikke nødvendigvis billigst på alle varer.',
      'Sammenlign den samlede pris på de varer, I faktisk køber, frem for kun at se på enkelte tilbud.',
    ],
  },
  {
    q: 'Er Nemlig.com billigere end supermarkederne?',
    a: [
      'Nemlig.com var ikke billigst på den samlede varekurv i vores analyse.',
      'Pristjekket viser, at onlinehandel ikke automatisk er billigere, men levering og tidsbesparelse kan også have værdi for familien.',
    ],
  },
  {
    q: 'Hvor meget kan en familie spare?',
    a: [
      'Forskellen mellem den billigste og dyreste samlede kurv var op til 11.305 kr. om året.',
      'Besparelsen kan nå op til 15.481 kr. om året, hvis hver vare købes dér, hvor den er billigst.',
    ],
  },
  {
    q: 'Hvordan er analysen lavet?',
    a: [
      'Vi sammenlignede den samme kurv med 23 varer hos 7 kæder i en enkelt uge.',
      'Varekurven tager udgangspunkt i en husstand med 2 voksne og 2 teenagere, og hele metoden findes i Q2-rapporten.',
    ],
  },
  {
    q: 'Skal jeg handle i flere butikker for at spare?',
    a: [
      'Nej, du kan ofte spare ved at vælge en billig hovedbutik og planlægge efter relevante tilbud.',
      'En ekstra butik giver bedst mening, når besparelsen opvejer den ekstra tid og transport.',
    ],
  },
]

const MUTED = '#6f6a61'
const FOREST = '#163223'

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-normal mt-12 mb-4 text-balance" style={{ color: FOREST }}>
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base leading-relaxed mb-4 text-pretty" style={{ color: 'rgba(22,50,35,0.8)' }}>
      {children}
    </p>
  )
}

export default function BilligsteSupermarked() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.join(' ') },
    })),
  }

  return (
    <>
      <Nav
        banner={{
          longPrefix: 'Vores pristjek: op til 11.305 kr. at spare på dagligvarer om året. ',
          shortPrefix: 'Spar på dagligvarer? ',
          source: 'billigste-supermarked-banner',
        }}
      />
      <script
        type="application/ld+json"
        // '<' escapes as <: JSON.stringify does not escape '<', so a
        // future FAQ text containing '</script>' could break out of the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      <main
        className="min-h-screen pt-32 pb-0"
        style={{ background: '#fdfaf4', fontFamily: 'var(--font-onest)', color: FOREST }}
      >
        <div className="max-w-2xl mx-auto px-6 pb-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm mb-10 transition-opacity hover:opacity-70"
            style={{ color: MUTED }}
          >
            <span aria-hidden="true">←</span> Tilbage
          </Link>

          <h1 className="text-3xl sm:text-4xl font-normal mb-1 text-balance">Hvilket supermarked er billigst?</h1>
          <p className="text-xs mb-10" style={{ color: 'rgba(22,50,35,0.5)' }}>
            Opdateret: juli 2026 · Baseret på Altid Mads Q2-analyse · Opdateres kvartalsvist
          </p>

          <P>
            Rema 1000 var det billigste supermarked for hele varekurven i vores Q2-analyse. Kurven kostede
            802,79 kr. hos Rema 1000 og 1.020,20 kr. hos Spar.
          </P>
          <P>
            Det betyder ikke, at Rema 1000 er billigst på alle varer eller i alle uger. Det bedste valg
            afhænger også af jeres faste indkøb, ugens tilbud og hvor mange butikker I vil besøge.
          </P>

          <H2>Rema 1000 var billigst i vores pristjek</H2>
          <P>
            Vi sammenlignede den samme ugentlige kurv med 23 varer hos 7 kæder: Rema 1000, Netto, Bilka,
            Føtex, Nemlig.com, Min Købmand og Spar.
          </P>
          <P>
            Rema 1000 havde den billigste samlede kurv til 802,79 kr., mens Spar var dyrest til 1.020,20 kr.
            Prisforskellen på præcis de samme varer var 21,3 pct.
          </P>
          <P>
            Forskellen svarer til 217,41 kr. om ugen og op til 11.305 kr. om året. For en familie kan valget
            af supermarked derfor have mærkbar betydning for husholdningsbudgettet.
          </P>

          <H2>Den billigste kæde er ikke hele svaret</H2>
          <P>
            En kæde kan have den billigste samlede kurv uden at være billigst på hver enkelt vare. Nogle
            basisvarer er billigst ét sted, mens ugens tilbud gør andre varer billigere hos en anden kæde.
          </P>
          <P>
            Hvis hver vare købes dér, hvor den er billigst, falder kurvens pris til 722,49 kr. om ugen.
            Sammenlignet med den dyreste samlede kurv giver det en besparelse på op til 15.481 kr. om året.
          </P>
          <P>
            Det er dog sjældent praktisk at besøge alle kæder. Den reelle besparelse skal altid vejes op mod
            transport, tid og risikoen for ekstra impulskøb.
          </P>

          <div className="my-8 flex justify-center">
            <a
              href="#venteliste"
              className="inline-flex items-center justify-center rounded-full px-7 py-4 text-[16px] font-medium transition-opacity hover:opacity-85"
              style={{ background: '#DCD799', color: FOREST }}
            >
              Lad Altid Mad finde besparelsen for jer
            </a>
          </div>

          <H2>Sådan har vi lavet analysen</H2>
          <P>
            Analysen tager udgangspunkt i den samme ugentlige kurv med 23 varer hos Rema 1000, Netto, Bilka,
            Føtex, Nemlig.com, Min Købmand og Spar. Kurven er baseret på en husstand med 2 voksne og 2
            teenagere.
          </P>
          <P>
            Pristjekket er et øjebliksbillede fra en enkelt uge i vores Q2-analyse. Du kan læse den samlede
            metode og se varegrundlaget i{' '}
            <a
              href="/altid-mad-kvartalsrapport-q2.pdf"
              className="underline underline-offset-4 hover:opacity-70"
              style={{ color: FOREST }}
            >
              Q2-rapporten
            </a>
            .
          </P>
          <P>
            Analysen viser ikke, at én kæde altid er billigst. Priser og tilbud skifter fra uge til uge, og
            jeres egen varekurv kan give et andet resultat.
          </P>

          <H2>Find de billigste varer uden at køre rundt</H2>
          <P>
            Start med at skelne mellem faste varer og tilbudsvarer. Køb basisvarer dér, hvor jeres samlede
            standardkurv typisk er billigst, og brug tilbudsaviserne til de varer, der fylder mest i
            budgettet.
          </P>
          <P>
            Lav madplanen, før I vælger tilbud. Så undgår I at købe en billig vare, som ikke passer ind i
            ugens måltider eller ender med at blive smidt ud.
          </P>
          <P>
            Vælg kun en ekstra butik, når besparelsen er tydelig og passer naturligt ind i jeres uge. Se
            også vores guide til{' '}
            <Link
              href="/madpakker-paa-budget"
              className="underline underline-offset-4 hover:opacity-70"
              style={{ color: FOREST }}
            >
              madpakker på budget
            </Link>
            .
          </P>

          <H2>Sådan skal Altid Mad hjælpe</H2>
          <P>
            Altid Mad er udviklet til at læse tilbudsaviserne, bygge en madplan efter familiens smag og
            finde ugens dagligvarer til de bedste priser. Målet er at gøre det lettere at bruge pristjek og
            tilbud i hverdagen uden selv at gennemgå hver enkelt tilbudsavis.
          </P>
          <P>
            Appen er endnu ikke lanceret, men ventelisten er åben på altidmad.dk. Altid Mad er en del af
            Altid Hjem, som samler hjemmets faste udgifter med ét overblik og ét login, og teamet står også
            bag Altid Energi, Danmarks første gebyrfrie energiselskab.
          </P>
        </div>

        {/* Animated pristjek mockup — the app scanning the week's basket
            across the 7 chains, built for this page (forsikring-page pattern). */}
        <div className="max-w-2xl mx-auto px-6 pb-20">
          <div
            className="rounded-3xl flex justify-center py-10 px-4"
            style={{ background: 'linear-gradient(160deg, rgba(168,224,99,0.12) 0%, rgba(22,50,35,0.05) 100%)' }}
          >
            <PristjekMockup />
          </div>
          <p className="text-xs mt-3 text-center" style={{ color: 'rgba(22,50,35,0.5)' }}>
            Altid Mad sammenligner ugens kurv på tværs af kæderne og viser, hvor familien sparer mest.
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-6 pb-20">
          <H2>Ofte stillede spørgsmål</H2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl overflow-hidden transition-colors"
                style={{ background: '#ffffff', border: '1px solid rgba(22,50,35,0.1)', boxShadow: '0 1px 3px rgba(22,50,35,0.06)' }}
              >
                <summary
                  className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <h3 className="font-medium text-sm" style={{ color: FOREST }}>{f.q}</h3>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-lg leading-none transition-transform duration-200 group-open:rotate-45"
                    style={{ color: FOREST }}
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-0 space-y-3">
                  {f.a.map((paragraph) => (
                    <p key={paragraph} className="text-base leading-relaxed" style={{ color: 'rgba(22,50,35,0.8)' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div id="venteliste">
        <BottomCta
          eyebrow="Slip for selv at holde pristjek"
          subtitle="Skriv dig på ventelisten, så får du besked, når Altid Mad er klar til at finde ugens bedste priser for jer. Gratis."
          source="billigste-supermarked"
        />
        </div>
      </main>
      <Footer />
    </>
  )
}
