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
  title: 'Madbudget for familie på 4: Hvad er normalt? – Altid Mad',
  description:
    'Se, hvad et normalt madbudget for en familie på 4 er, hvorfor det varierer, og hvordan I får pengene til at række længere. Få konkrete råd.',
}

// FAQ copy is used twice: rendered on the page AND serialized as FAQPage
// schema (rich results). Keep the two in sync by editing only this array.
const FAQ: FaqItem[] = [
  {
    q: 'Hvad er et normalt madbudget for en familie på 4?',
    a: [
      'Et relevant pejlemærke er cirka 5.481 kr. om måneden.',
      'Det bygger på Forbrugsundersøgelsen 2024 fra Danmarks Statistik, hvor 2 voksne med børn bruger 65.775 kr. om året på fødevarer og ikke-alkoholiske drikkevarer.',
    ],
  },
  {
    q: 'Er 4.000 kr. om måneden realistisk for 4 personer?',
    a: [
      'Ja, 4.000 kr. om måneden kan være realistisk for en familie på 4.',
      'Det kræver typisk planlagte indkøb, begrænsede impulskøb og retter, der bruger de samme råvarer på tværs af ugen.',
    ],
  },
  {
    q: 'Hvorfor bruger vi meget mere end DST-gennemsnittet?',
    a: [
      'I kan bruge mere på grund af børnenes alder, specialkost, økologi, madpakker eller forskellige måder at opgøre budgettet på.',
      'Danmarks Statistiks tal er et gennemsnit og ikke en grænse for, hvad en familie bør bruge.',
    ],
  },
  {
    q: 'Hvor meget betyder supermarkedsvalget?',
    a: [
      'Supermarkedsvalget kan betyde op til 11.305 kr. om året i vores analyse.',
      'Den samme kurv med 23 varer kostede 802,79 kr. hos Rema 1000 og 1.020,20 kr. hos Spar, en forskel på 21,3 pct.',
    ],
  },
  {
    q: 'Betyder børnenes alder noget?',
    a: [
      'Ja, børnenes alder kan have stor betydning for madbudgettet.',
      'Teenagere spiser ofte omtrent som voksne, så en husstand med 2 voksne og 2 teenagere vil typisk have andre behov end en familie med små børn.',
    ],
  },
  {
    q: 'Hvordan sætter vi et budget, der holder?',
    a: [
      'Tag udgangspunkt i jeres faktiske køb, og vælg derefter et realistisk beløb med plads til travle dage.',
      'Følg løbende op på hovedindkøb, suppleringskøb og madspild, så I justerer vanerne frem for kun at sænke beløbet.',
    ],
  },
]

export default function MadbudgetFamiliePaa4() {
  return (
    <>
      <Nav
        banner={{
          longPrefix: 'Madbudget for en familie på 4: se hvad der er normalt. ',
          shortPrefix: 'Familie på 4? ',
          source: 'familie-paa-4-banner',
        }}
      />
      <FaqSchemaScript faq={FAQ} />
      <main
        className="min-h-screen pt-32 pb-0"
        style={{ background: '#fdfaf4', fontFamily: 'var(--font-onest)', color: FOREST }}
      >
        <div className="max-w-2xl mx-auto px-6 pb-4">
          <BackLink />

          <h1 className="text-3xl sm:text-4xl font-normal mb-1 text-balance">Hvad koster mad til en familie på 4?</h1>
          <p className="text-xs mb-10" style={{ color: FAINT_INK }}>
            Opdateret: juli 2026 · Kilde: Danmarks Statistik, Forbrugsundersøgelsen 2024
          </p>

          <P>
            Danmarks Statistik viser, at 2 voksne med børn i gennemsnit bruger 65.775 kr. om året, svarende til cirka 5.481 kr. om måneden, på fødevarer og ikke-alkoholiske drikkevarer. I forældrefora fortæller familier typisk om madbudgetter på 4.000-7.000 kr. om måneden, så begge niveauer kan være helt normale.
          </P>
          <P>
            Det rigtige madbudget afhænger blandt andet af børnenes alder, familiens appetit, madpakker og valg af supermarked. Teenagere spiser ofte omtrent som voksne, og derfor kan en familie med større børn ligge højere end en familie med små børn.
          </P>
          <P>
            Her får I konkrete sammenligningstal og en enkel metode til at finde et budget, der passer til netop jeres familie.
          </P>
        </div>


        <div className="max-w-2xl mx-auto px-6 pb-20">
          <H2>Hvad er et normalt madbudget for 4 personer?</H2>
          <P>
            Forbrugsundersøgelsen 2024 fra Danmarks Statistik viser et årligt forbrug på 65.775 kr. for 2 voksne med børn. Det svarer til cirka 5.481 kr. om måneden og omfatter alle fødevarer og ikke-alkoholiske drikkevarer gennem hele året.
          </P>
          <P>
            Til sammenligning bruger en gennemsnitshusstand 41.851 kr. om året, svarende til cirka 3.488 kr. om måneden. Enlige med børn ligger på 38.564 kr. om året, cirka 3.214 kr. om måneden, mens 2 voksne under 60 uden børn ligger på 41.730 kr., cirka 3.478 kr. om måneden.
          </P>
          <P>
            Tallene er pejlemærker, ikke facitlister. Danmarks Statistik måler hele årets forbrug, og familier kan have meget forskellige vaner, behov og definitioner af, hvad der hører til madbudgettet.
          </P>
          <H2>Børnenes alder gør en mærkbar forskel</H2>
          <P>
            Små børn, skolebørn og teenagere har ikke samme behov. Teenagere spiser ofte som voksne, især når det gælder aftensmad, mellemmåltider og madpakker.
          </P>
          <P>
            Altid Mads kurvanalyse tager netop udgangspunkt i en husstand med 2 voksne og 2 teenagere. Den kan derfor være et mere relevant pejlemærke for familier med større børn end for familier med små børn.
          </P>
          <P>
            Andre forhold spiller også ind. Specialkost, økologi, måltider ude, mange madpakker og gæster kan alle gøre et højere budget både forståeligt og nødvendigt.
          </P>
          <H2>Samme madkurv kan koste 21,3 pct. mere</H2>
          <P>
            Vi sammenlignede den samme ugentlige kurv med 23 varer hos Rema 1000, Netto, Bilka, Føtex, Nemlig.com, Min Købmand og Spar. Hele kurven kostede 802,79 kr. hos Rema 1000 og 1.020,20 kr. hos Spar.
          </P>
          <P>
            Forskellen var 217,41 kr. om ugen, svarende til op til 11.305 kr. om året. Omregnet svarer kurvene til cirka 3.479 kr. og 4.421 kr. om måneden.
          </P>
          <P>
            Hvis hver vare købes dér, hvor den er billigst, koster kurven 722,49 kr. om ugen. Det giver en forskel på op til 15.481 kr. om året sammenlignet med den dyreste samlede kurv, men kræver indkøb på tværs af butikker.
          </P>
          <P>
            Kurvanalysen kan ikke sammenlignes direkte med Danmarks Statistiks tal. Den dækker én bestemt uges kurv for 2 voksne og 2 teenagere, mens Forbrugsundersøgelsen 2024 omfatter alle årets køb af fødevarer og ikke-alkoholiske drikkevarer.
          </P>
          <MidCta label="Se hvad jeres familie kan spare" />
          <H2>Sådan finder I familiens eget madbudget</H2>
          <P>
            Start med jeres faktiske forbrug frem for et ønsketal. Saml køb af mad, drikkevarer, madpakker og små suppleringskøb, så I kan se, hvor pengene reelt går hen.
          </P>
          <P>
            Skeln derefter mellem nødvendige køb og de køb, der opstår uden plan. Vores <A href="/beregn-dit-madbudget">beregner til madbudgettet</A> kan hjælpe jer med at finde et realistisk niveau ud fra jeres egen hverdag.
          </P>
          <P>
            Vælg et budget, der giver plads til travle dage og familiens præferencer. Et budget holder bedre, når det bygger på vaner, I faktisk kan leve med, end når det kræver, at alle indkøb bliver perfekte.
          </P>
          <H2>Vanerne, der ofte flytter mest</H2>
          <P>
            Vælg en fast hovedbutik ud fra priserne på de varer, I køber ofte. Se vores sammenligning af <A href="/billigste-supermarked">det billigste supermarked</A>, men husk også transporttid og risikoen for ekstra impulskøb.
          </P>
          <P>
            Lav en <A href="/madplan-efter-tilbud">madplan efter tilbud</A>, og planlæg retter med ingredienser, der kan bruges flere gange. Det reducerer både dyre nødkøb og madspild.
          </P>
          <P>
            Madpakker er også et oplagt sted at skabe ro i budgettet. Faste valg og genbrug af ingredienser fra aftensmaden gør det lettere at købe målrettet.
          </P>
          <H2>Sådan kan Altid Mad hjælpe</H2>
          <P>
            Altid Mad er en kommende dansk app, som læser tilbudsaviser, bygger en madplan efter familiens smag og finder ugens dagligvarer til de bedste priser. Ventelisten er åben på altidmad.dk.
          </P>
          <P>
            Målet er at gøre prisbevidste valg lettere uden at sende familien rundt efter hvert enkelt tilbud. Altid Mad er en del af Altid Hjem, som samler hjemmets faste udgifter med ét overblik og ét login, og teamet står også bag Altid Energi, Danmarks første gebyrfrie energiselskab.
          </P>
          <P>
            Skriv jer på ventelisten, hvis I gerne vil have hjælp til at forbinde tilbud, madplan og familiens egne præferencer.
          </P>
        </div>

        <MockupFrame caption="Familier med børn ligger højest i Forbrugsundersøgelsen. Se hvor I ligger.">
          <MadbudgetBenchmark highlight="par-boern" />
        </MockupFrame>
        <FaqAccordion faq={FAQ} />

        <div id="venteliste">
          <BottomCta
            eyebrow='Mere familie, mindre regneark'
            subtitle='Skriv dig på ventelisten, så får du besked, når Altid Mad kan hjælpe familien med madplan og indkøb. Gratis.'
            source='madbudget-familie-paa-4'
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
