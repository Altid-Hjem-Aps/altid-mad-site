import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'
import MadpakkeMockup from '@/components/MadpakkeMockup'
import BottomCta from '@/components/sections/BottomCta'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Madpakker på budget til skolestart – Altid Mad',
  description:
    'Få idéer til madpakker på budget, en enkel ugeplan og råd til billigere indkøb ved skolestart. Læs guiden, og kom godt i gang.',
}

// FAQ copy is used twice: rendered on the page AND serialized as FAQPage
// schema (rich results). Keep the two in sync by editing only this array.
const FAQ: { q: string; a: string[] }[] = [
  {
    q: 'Hvordan laver jeg billige madpakker, børnene faktisk spiser?',
    a: [
      'Tag udgangspunkt i billige basisvarer, som barnet allerede kan lide.',
      'Variér formen, og brug eksempelvis de samme råvarer i rugbrød, wraps, sandwich og små hapsere.',
    ],
  },
  {
    q: 'Hvad skal en god madpakke indeholde?',
    a: [
      'En god madpakke skal mætte og være nem for barnet at spise.',
      'Kombinér gerne brød, pasta eller kartofler med en proteinkilde samt frugt eller grønt, og tilpas mængden til barnets appetit.',
    ],
  },
  {
    q: 'Er det billigere at smøre madpakker end at købe?',
    a: [
      'Det er som regel billigere at smøre madpakken hjemme, især når I bruger basisvarer, tilbud og rester.',
      'Færdige måltider, enkeltportioner og snacks købt undervejs gør hurtigt madpakken dyrere.',
    ],
  },
  {
    q: 'Hvordan undgår jeg, at madpakken kommer retur?',
    a: [
      'Pak mad, barnet kender og kan spise uden besvær.',
      'Spørg, hvad der blev spist, justér portionsstørrelsen, og hold grønt og brød adskilt, hvis barnet ikke bryder sig om bløde madder.',
    ],
  },
  {
    q: 'Hvordan sparer jeg tid på madpakker om morgenen?',
    a: [
      'Forbered så meget som muligt aftenen før.',
      'Skær grønt, kog æg, fordel snacks og læg beholdere frem, så morgenen primært handler om at samle madpakken.',
    ],
  },
  {
    q: 'Kan Altid Mad hjælpe med madpakker?',
    a: [
      'Ja, Altid Mad skal tænke madpakker sammen med ugens madplan, tilbud og indkøbsliste.',
      'Appen er ikke lanceret endnu, men du kan skrive dig på ventelisten på altidmad.dk.',
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

export default function MadpakkerPaaBudget() {
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
          longPrefix: 'Skolestart: lad Altid Mad tænke madpakkerne ind i ugens madplan. ',
          shortPrefix: 'Madpakker uden bøvl? ',
          source: 'madpakker-banner',
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

          <h1 className="text-3xl sm:text-4xl font-normal mb-1 text-balance">
            Madpakker på budget, som børnene har lyst til at spise
          </h1>
          <p className="text-xs mb-10" style={{ color: 'rgba(22,50,35,0.5)' }}>
            Opdateret: september 2026
          </p>

          <P>
            Når skolestart nærmer sig, vender madpakkerne tilbage som en fast del af hverdagen. Det er både
            et spørgsmål om at holde udgifterne nede og finde på noget, som faktisk bliver spist.
          </P>
          <P>
            Heldigvis behøver billige madpakker hverken være kedelige eller besværlige. Med få basisvarer,
            lidt planlægning og et blik på ugens tilbud kan I skabe variation uden at købe en masse særlige
            madpakkevarer.
          </P>

          <H2>Madpakkehverdagen kræver mere, end man tror</H2>
          <P>
            Ét skolebarn skal typisk have 5 madpakker med om ugen. Når familien først står i køkkenet om
            morgenen, er der sjældent tid til at finde på noget eller opdage, at rugbrødet mangler.
          </P>
          <P>
            En enkel ugeplan gør det lettere at købe de rigtige mængder og bruge de samme råvarer på flere
            måder. Planlægning slår impulskøb, især når alternativet er dyre snacks eller hurtige løsninger
            på vej til skole.
          </P>
          <P>
            Vælg gerne nogle faste byggesten til ugen, eksempelvis brød, grønt, frugt, pålæg og en mættende
            rest fra aftensmaden. Så kan indholdet varieres, uden at indkøbslisten vokser unødigt.
          </P>

          <H2>8 billige madpakke-idéer til skolestart</H2>
          <P>
            Rugbrød med æg og agurk er enkelt, mættende og nemt at forberede. Rugbrød med hummus og revet
            gulerod giver en mild variant uden klassisk pålæg.
          </P>
          <P>
            En pastasalat kan laves med rester af pasta, grøntsager og lidt dressing. En lille wrap med
            kylling eller bønner er oplagt, når fyldet allerede indgår i aftensmaden.
          </P>
          <P>
            Mini-sandwich med ost og grønt er nemme for mindre hænder. En kold kartoffelmad med mayonnaise
            og purløg udnytter kogte kartofler fra dagen før.
          </P>
          <P>
            Havregrynsboller med ost eller hjemmelavet pålæg kan bages, når der er tid, og fryses ned.
            Frugtstykker, grøntsagsstænger eller en lille portion hjemmepoppede popcorn kan bruges som
            tilbehør frem for færdigpakkede snacks.
          </P>

          <H2>Planlæg ugens madpakker efter tilbudsaviserne</H2>
          <P>
            Start med at se, hvilke basisvarer der er på tilbud. Brød, æg, ost, frugt, grønt og pålæg kan
            danne rammen om ugens madpakker, hvis familien kan lide dem og når at bruge dem.
          </P>
          <P>
            Tænk derefter madpakken ind i indkøbet til aftensmad. Skal I have pasta, kartofler, kylling
            eller grøntsager til aften, kan en passende rest blive til pastasalat, sandwichfyld eller små
            hapsere næste dag.
          </P>
          <P>
            Planlæg også, hvilke varer der skal bruges først. Moden frugt kan skæres i stykker,
            grøntsagsrester kan komme i en wrap, og brød kan fryses ned, før det bliver tørt.
          </P>

          <H2>Undgå de dyre fælder i madpakken</H2>
          <P>
            Færdigpakkede snacks og enkeltportioner er praktiske, men emballagen gør dem ofte til en dyr
            vane. Køb større pakker, og fordel selv maden i små beholdere, når det passer ind i hverdagen.
          </P>
          <P>
            Variation kræver ikke nye ingredienser hver dag. Det samme brød, grønt og fyld kan serveres som
            rugbrød, sandwich, wrap eller små hapsere.
          </P>
          <P>
            Madspild er også en skjult udgift. Pak hellere en mindre portion, som barnet spiser, og læg lidt
            ekstra ved, når appetitten kræver det.
          </P>

          <div className="my-8 flex justify-center">
            <a
              href="#venteliste"
              className="inline-flex items-center justify-center rounded-full px-7 py-4 text-[16px] font-medium transition-opacity hover:opacity-85"
              style={{ background: '#DCD799', color: FOREST }}
            >
              Få madpakkerne med i ugens madplan
            </a>
          </div>

          <H2>Så meget kan valget af supermarked betyde</H2>
          <P>
            Altid Mad har analyseret den samme ugentlige kurv med 23 varer hos Lidl, Rema 1000, Netto, 365discount, Meny, Bilka, Kvickly, Super Brugsen, Føtex, Brugsen, Nemlig.com, Spar og Min Købmand. Kurven kostede 782,70 kr. hos Lidl og 1.313,94 kr.
            hos Min Købmand, en forskel på 531,24 kr. om ugen og op til 27.624 kr. om året.
          </P>
          <P>
            Prisforskellen på den samme kurv var 40,4 pct. Beregningen tager udgangspunkt i en husstand med
            2 voksne og 2 teenagere.
          </P>
          <P>
            Hvis hver vare købes dér, hvor den er billigst, kostede kurven 616,86 kr. om ugen. Det svarer
            til op til 36.248 kr. om året sammenlignet med den dyreste samlede kurv. Se hele sammenligningen
            i vores{' '}
            <Link
              href="/billigste-supermarked"
              className="underline underline-offset-4 hover:opacity-70"
              style={{ color: FOREST }}
            >
              pristjek af supermarkederne
            </Link>
            .
          </P>

          <H2>Sådan skal Altid Mad hjælpe familien</H2>
          <P>
            Altid Mad skal læse tilbudsaviserne, bygge en madplan efter familiens smag og finde ugens
            dagligvarer til de bedste priser. Indkøbslisten skal samle det, I skal bruge, så tilbud,
            aftensmad og madpakker kan tænkes sammen.
          </P>
          <P>
            Madpakketænkningen skal være en del af ugens plan. Råvarer fra aftensmaden kan få en plads i
            næste dags madpakke, og relevante basisvarer på tilbud kan indgå i indkøbslisten.
          </P>
          <P>
            Appen er ikke lanceret endnu, men ventelisten er åben på altidmad.dk. Altid Mad er en del af
            Altid Hjem, som samler hjemmets faste udgifter med ét overblik og ét login, og teamet står også
            bag Altid Energi, Danmarks første gebyrfrie energiselskab.
          </P>
        </div>

        {/* Animated madpakke mockup — the week's lunchboxes planned from the
            tilbudsaviser, built for this page (forsikring-page pattern). */}
        <div className="max-w-2xl mx-auto px-6 pb-20">
          <div
            className="rounded-3xl flex justify-center py-10 px-4"
            style={{ background: 'linear-gradient(160deg, rgba(168,224,99,0.12) 0%, rgba(22,50,35,0.05) 100%)' }}
          >
            <MadpakkeMockup />
          </div>
          <p className="text-xs mt-3 text-center" style={{ color: 'rgba(22,50,35,0.5)' }}>
            Altid Mad planlægger ugens madpakker efter tilbudsaviserne og skriver indkøbslisten for jer.
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
          eyebrow="Madpakkerne planlægger snart sig selv"
          subtitle="Skriv dig på ventelisten, så får du besked, når Altid Mad kan tænke tilbud, aftensmad og madpakker sammen for jer. Gratis."
          source="madpakker-paa-budget"
        />
        </div>
      </main>
      <Footer />
    </>
  )
}
