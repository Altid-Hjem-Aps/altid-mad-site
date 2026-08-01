import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import MadbudgetBenchmark from '@/components/MadbudgetBenchmark'
import BottomCta from '@/components/sections/BottomCta'
import Footer from '@/components/Footer'
import {
  A,
  BackLink,
  FAINT_INK,
  FOREST,
  FaqAccordion,
  FaqItem,
  FaqSchemaScript,
  H2,
  MidCta,
  MockupFrame,
  P,
} from '@/components/seo/article'

export const metadata: Metadata = {
  title: 'Madbudget for familien: Hvad er normalt? – Altid Mad',
  description:
    'Se, hvad et normalt madbudget er for familier og andre husstande, og få konkrete råd til at lægge et budget, der holder. Kom godt i gang.',
}

// FAQ copy is used twice: rendered on the page AND serialized as FAQPage
// schema (rich results). Keep the two in sync by editing only this array.
const FAQ: FaqItem[] = [
  {
    q: 'Hvad er et normalt madbudget for en familie på 4?',
    a: [
      'For 2 voksne med børn er gennemsnittet ca. 5.481 kr. om måneden ifølge Forbrugsundersøgelsen 2024.',
      'Beløbet dækker fødevarer og ikke-alkoholiske drikkevarer, og jeres behov kan være højere eller lavere.',
    ],
  },
  {
    q: 'Hvad bruger 2 voksne på mad om måneden?',
    a: [
      '2 voksne under 60 uden børn bruger i gennemsnit ca. 3.478 kr. om måneden ifølge Danmarks Statistik.',
      'Det er et gennemsnit, så appetit, madvaner og valg af butikker kan flytte beløbet mærkbart.',
    ],
  },
  {
    q: 'Er 3.000 kr. om måneden nok til mad?',
    a: [
      'Det kan være nok for nogle husstande, men det kræver typisk en fast madplan, få impulskøb og begrænset madspild.',
      'Vores guide til mad for 3.000 kr. om måneden viser, hvordan et stramt budget kan fordeles i praksis.',
    ],
  },
  {
    q: 'Hvorfor bruger vi mere end gennemsnittet?',
    a: [
      'I kan bruge mere på grund af husstandens størrelse, teenagere, særlige kostbehov, takeaway eller dyre indkøbssteder.',
      'Undersøg også, om jeres opgørelse inkluderer andre dagligvarer, mens Danmarks Statistiks tal kun dækker fødevarer og ikke-alkoholiske drikkevarer.',
    ],
  },
  {
    q: 'Hvad tæller med i et madbudget?',
    a: [
      'Et madbudget bør som minimum omfatte fødevarer og ikke-alkoholiske drikkevarer til hjemmet.',
      'I kan vælge at medregne takeaway og restaurantbesøg, men hold rengøring, personlig pleje og andre dagligvarer adskilt, hvis I vil sammenligne med Danmarks Statistik.',
    ],
  },
  {
    q: 'Hvordan kommer vi i gang med at spare?',
    a: [
      'Gennemgå jeres faktiske forbrug, planlæg ugens måltider og sammenlign prisen på den samlede indkøbskurv.',
      'Begynd med de ændringer, der er nemme at gentage, såsom en indkøbsliste, færre ekstrature og bedre brug af rester.',
    ],
  },
]

export default function Madbudget() {
  return (
    <>
      <Nav
        banner={{
          longPrefix: 'Hvad er et normalt madbudget? Se tallene fra Danmarks Statistik. ',
          shortPrefix: 'Hvad er normalt? ',
          source: 'madbudget-banner',
        }}
      />
      <FaqSchemaScript faq={FAQ} />
      <main
        className="min-h-screen pt-32 pb-0"
        style={{ background: '#fdfaf4', fontFamily: 'var(--font-onest)', color: FOREST }}
      >
        <div className="max-w-2xl mx-auto px-6 pb-4">
          <BackLink />

          <h1 className="text-3xl sm:text-4xl font-normal mb-1 text-balance">Hvad er et normalt madbudget for en familie?</h1>
          <p className="text-xs mb-10" style={{ color: FAINT_INK }}>
            Opdateret: juli 2026 · Kilde: Danmarks Statistik, Forbrugsundersøgelsen 2024
          </p>

          <P>
            Et normalt madbudget afhænger især af husstandens størrelse. Ifølge Danmarks Statistik bruger en gennemsnitshusstand 41.851 kr. om året på fødevarer og ikke-alkoholiske drikkevarer, svarende til ca. 3.488 kr. om måneden.
          </P>
          <P>
            For 2 voksne med børn er gennemsnittet 65.775 kr. om året, svarende til ca. 5.481 kr. om måneden. Tallene er et nyttigt pejlemærke, men jeres realistiske budget afhænger også af børnenes alder, madvaner og hvor I handler.
          </P>
        </div>


        <div className="max-w-2xl mx-auto px-6 pb-20">
          <H2>Hvad bruger danske husstande faktisk?</H2>
          <P>
            Tabellen viser tal fra Danmarks Statistiks Forbrugsundersøgelse 2024. Enlige med børn bruger i gennemsnit 38.564 kr. om året, svarende til ca. 3.214 kr. om måneden.
          </P>
          <P>
            For 2 voksne under 60 uden børn er beløbet 41.730 kr. om året, svarende til ca. 3.478 kr. om måneden. Kategorien omfatter alle fødevarer og ikke-alkoholiske drikkevarer gennem hele året.
          </P>
          <P>
            En gennemsnitshusstand består af ca. 2,1 personer. Derfor kan gennemsnittet ikke sammenlignes direkte med en familie eller med en enkelt ugentlig indkøbskurv.
          </P>
          <H2>Hvorfor er beløbene i forældrefora ofte højere?</H2>
          <P>
            I forældrefora fortæller familier ofte, at de bruger 4.000-7.000 kr. om måneden på dagligvarer. Forskellen skyldes blandt andet, at familier ikke altid bruger samme definition af et madbudget.
          </P>
          <P>
            Nogle tæller kun mad og drikke med, mens andre også medregner rengøring, toiletpapir, bleer og personlig pleje. Danmarks Statistiks tal er desuden et årsgennemsnit, så dyre højtider og billige ferieuger udligner hinanden.
          </P>
          <P>
            Sammenlign derfor først jeres forbrug med en husstand, der ligner jeres. Tjek derefter, hvilke varer og udgifter I faktisk har taget med.
          </P>
          <H2>Supermarkedsvalget kan flytte budgettet mærkbart</H2>
          <P>
            Vores analyse sammenlignede den samme ugentlige kurv med 23 varer hos Rema 1000, Netto, Bilka, Føtex, Nemlig.com, Min Købmand og Spar. Kurven kostede 802,79 kr. hos Rema 1000 og 1.020,20 kr. hos Spar, en prisforskel på 21,3 pct.
          </P>
          <P>
            Forskellen var 217,41 kr. om ugen, svarende til op til 11.305 kr. om året. Hvis hver vare købes dér, hvor den er billigst, kostede kurven 722,49 kr. om ugen, svarende til op til 15.481 kr. om året sammenlignet med den dyreste kurv.
          </P>
          <P>
            Den billigste samlede kurv svarer til ca. 3.479 kr. om måneden, mens den dyreste svarer til ca. 4.421 kr. Beregningen gælder én bestemt kurv til 2 voksne og 2 teenagere, så den kan ikke sidestilles med Danmarks Statistiks helårstal.
          </P>
          <P>
            Læs mere om metoden og resultaterne i vores pristjek af <A href="/billigste-supermarked">det billigste supermarked</A>.
          </P>
          <MidCta label="Lad Altid Mad holde budgettet for jer" />
          <H2>Sådan sætter I et realistisk madbudget</H2>
          <P>
            Start med jeres faktiske køb fra en almindelig måned. Sortér dem i mad og drikkevarer, andre dagligvarer samt takeaway og restaurantbesøg, så I ved, hvad budgettet skal dække.
          </P>
          <P>
            Se derefter på de indkøb, der ofte vælter planen, for eksempel små ekstrature, impulskøb og mad, der ender som spild. Sæt et beløb, der kræver omtanke, men stadig passer til jeres appetit, tid og hverdag.
          </P>
          <P>
            Brug <A href="/beregn-dit-madbudget">madbudget-beregneren</A> til at få et personligt estimat ud fra jeres husstand. Følg løbende op, og justér budgettet, hvis det konsekvent er for stramt eller for højt.
          </P>
          <H2>Sådan holder I madbudgettet i hverdagen</H2>
          <P>
            Lav madplanen med udgangspunkt i det, I allerede har, og de råvarer der er på tilbud. Planlæg gerne retter, som deler ingredienser, så hele pakken bliver brugt.
          </P>
          <P>
            Skriv en indkøbsliste og vælg butik, før I tager hjemmefra. Sammenlign den samlede kurv, fordi enkelte gode tilbud ikke nødvendigvis gør hele indkøbet billigst.
          </P>
          <P>
            Få en enkel metode til at forbinde tilbud og aftensmad i vores guide til <A href="/madplan-efter-tilbud">madplan efter tilbud</A>. Et budget er lettest at holde, når planen passer til familiens smag og den tid, I faktisk har.
          </P>
          <H2>Hvad kan Altid Mad hjælpe med?</H2>
          <P>
            Altid Mad bliver en dansk app, der læser tilbudsaviserne, bygger en madplan efter familiens smag og finder ugens dagligvarer til de bedste priser. Målet er at gøre det lettere at planlægge både måltider og indkøb uden selv at gennemgå alle tilbud.
          </P>
          <P>
            Ventelisten er åben på altidmad.dk. Altid Mad er en del af Altid Hjem, som samler hjemmets faste udgifter med ét overblik og ét login, og teamet står også bag Altid Energi, Danmarks første gebyrfrie energiselskab.
          </P>
        </div>

        <MockupFrame caption="Så meget bruger danske husstande på mad om måneden ifølge Forbrugsundersøgelsen 2024.">
          <MadbudgetBenchmark />
        </MockupFrame>
        <FaqAccordion faq={FAQ} />

        <div id="venteliste">
          <BottomCta
            eyebrow='Fra benchmark til plan'
            subtitle='Skriv dig på ventelisten, så får du besked, når Altid Mad kan lægge madplanen efter jeres budget. Gratis.'
            source='madbudget'
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
