import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import BudgetCalculator from '@/components/BudgetCalculator'
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
  MockupFrame,
  P,
} from '@/components/seo/article'

export const metadata: Metadata = {
  title: 'Madbudget beregner: Se jeres niveau – Altid Mad',
  description:
    'Beregn jeres madbudget ud fra husstand og forbrug. Sammenlign med Danmarks Statistik, og se en mulig besparelse. Prøv beregneren gratis.',
}

// FAQ copy is used twice: rendered on the page AND serialized as FAQPage
// schema (rich results). Keep the two in sync by editing only this array.
const FAQ: FaqItem[] = [
  {
    q: 'Hvor præcist er estimatet?',
    a: [
      'Estimatet er et pejlemærke, ikke en garanti.',
      'Det bygger på Forbrugsundersøgelsen 2024 fra Danmarks Statistik og vores analyse af den samme kurv hos 7 kæder, men jeres madvaner og varevalg kan give et andet resultat.',
    ],
  },
  {
    q: 'Hvilke tal skal jeg bruge for at beregne?',
    a: [
      'Brug jeres normale forbrug på dagligvarer pr. måned.',
      'Tag gerne udgangspunkt i kontoudtog eller kvitteringer, og medregn fødevarer og ikke-alkoholiske drikkevarer, så sammenligningen bliver mere retvisende.',
    ],
  },
  {
    q: 'Hvad er et normalt madbudget for min husstand?',
    a: [
      'Der findes ikke ét normalt beløb, men Danmarks Statistik giver et nyttigt sammenligningsgrundlag.',
      'Forbrugsundersøgelsen 2024 viser cirka 3.488 kr. om måneden for en gennemsnitshusstand og cirka 5.481 kr. for 2 voksne med børn, og vores guide til madbudget hjælper jer med at vurdere tallene.',
    ],
  },
  {
    q: 'Kan vi virkelig spare 21 pct.?',
    a: [
      'Prisforskellen var 21,3 pct. på den samme kurv i vores analyse.',
      'I kan spare op til dette niveau, hvis jeres indkøb ligner testkurven, men jeres faktiske besparelse afhænger af varer, butikker, tilbud og muligheden for at handle flere steder.',
    ],
  },
  {
    q: 'Gemmer I mine svar?',
    a: [
      'Nej, jeres svar beregnes lokalt på siden og gemmes ikke.',
      'Vi gemmer kun de oplysninger, I selv afgiver, hvis I vælger at skrive jer på ventelisten.',
    ],
  },
  {
    q: 'Hvad gør jeg med resultatet?',
    a: [
      'Brug resultatet til at sætte et realistisk månedsmål og følge jeres faktiske forbrug.',
      'Planlæg ugens måltider efter tilbud, lav en indkøbsliste, og vurder efterfølgende, om målet passer til jeres familie.',
    ],
  },
]

export default function BeregnDitMadbudget() {
  return (
    <>
      <Nav
        banner={{
          longPrefix: 'Beregn jeres madbudget på et minut, og se hvad I kan spare. ',
          shortPrefix: 'Beregn jeres madbudget. ',
          source: 'beregn-dit-madbudget-banner',
        }}
      />
      <FaqSchemaScript faq={FAQ} />
      <main
        className="min-h-screen pt-32 pb-0"
        style={{ background: '#fdfaf4', fontFamily: 'var(--font-onest)', color: FOREST }}
      >
        <div className="max-w-2xl mx-auto px-6 pb-4">
          <BackLink />

          <h1 className="text-3xl sm:text-4xl font-normal mb-1 text-balance">Beregn jeres madbudget</h1>
          <p className="text-xs mb-10" style={{ color: FAINT_INK }}>
            Opdateret: juli 2026 · Kilde: Danmarks Statistik 2024 og Altid Mads Q2-analyse
          </p>

          <P>
            Madbudgetberegneren viser, hvordan jeres forbrug ligger i forhold til lignende husstande. I får også et estimat på, hvad I muligvis kan spare ved at planlægge indkøbene efter priser og tilbud.
          </P>
          <P>
            Beregneren skal kun bruge 2 tal og tager cirka 1 minut. Vælg jeres husstand, og indtast, hvad I normalt bruger på dagligvarer om måneden.
          </P>
        </div>

        <MockupFrame caption="Beregneren viser jeres benchmark og et estimat ud fra jeres eget tal. Intet gemmes.">
          <BudgetCalculator />
        </MockupFrame>
        <div className="max-w-2xl mx-auto px-6 pb-20">
          <H2>Sådan virker madbudgetberegneren</H2>
          <P>
            Vælg antal voksne og børn, og skriv jeres nuværende forbrug. Herefter får I et sammenligningsgrundlag fra Danmarks Statistik og et estimat på en mulig besparelse.
          </P>
          <P>
            Sammenligningen bygger på Forbrugsundersøgelsen 2024. Her bruger en gennemsnitshusstand 41.851 kr. om året på fødevarer og ikke-alkoholiske drikkevarer, svarende til cirka 3.488 kr. om måneden. For 2 voksne med børn er beløbet 65.775 kr. om året, svarende til cirka 5.481 kr. om måneden.
          </P>
          <P>
            Besparelsesestimatet bygger på vores kurvanalyse fra andet kvartal. Den samme ugentlige kurv med 23 varer blev sammenlignet hos 7 kæder, og prisforskellen var 21,3 pct. Resultatet vises derfor som op til, hvis jeres indkøb ligner testkurven.
          </P>
          <H2>Hvad afhænger et realistisk madbudget af?</H2>
          <P>
            Et realistisk madbudget afhænger først og fremmest af husstandens størrelse. Børnenes alder, appetit, madpakker, specialkost, økologi og hvor ofte I spiser hjemme, har også stor betydning.
          </P>
          <P>
            Ifølge Danmarks Statistik bruger enlige med børn cirka 3.214 kr. om måneden, mens 2 voksne under 60 uden børn bruger cirka 3.478 kr. Tallene omfatter alle fødevarer og ikke-alkoholiske drikkevarer gennem hele året.
          </P>
          <P>
            Statistikken kan derfor ikke sammenlignes direkte med vores testkurv, som dækker én uges 23 varer til 2 voksne og 2 teenagere. Brug resultatet som et pejlemærke, ikke som en facitliste. I kan få mere hjælp til at vurdere niveauet i vores guide til <A href="/madbudget">madbudget</A>.
          </P>
          <H2>Fra estimat til faktisk besparelse</H2>
          <P>
            Den mulige besparelse opstår ikke automatisk. Den kræver, at I planlægger måltider og indkøb efter de varer, der er billige den pågældende uge.
          </P>
          <P>
            I vores analyse kostede hele kurven 802,79 kr. hos Rema 1000 og 1.020,20 kr. hos Spar. Det svarer til cirka 3.479 kr. og 4.421 kr. om måneden. Forskellen var 217,41 kr. om ugen, op til 11.305 kr. om året.
          </P>
          <P>
            Hvis hver vare købes dér, hvor den er billigst, kostede kurven 722,49 kr. om ugen. Det giver op til 15.481 kr. om året sammenlignet med den dyreste samlede kurv, men kan kræve indkøb flere steder. Se, hvordan I kan lave en <A href="/madplan-efter-tilbud">madplan efter tilbud</A>, og læs vores sammenligning af det <A href="/billigste-supermarked">billigste supermarked</A>.
          </P>
          <H2>Hvad Altid Mad skal hjælpe med</H2>
          <P>
            Altid Mad skal læse tilbudsaviserne, foreslå en madplan efter familiens smag og finde ugens dagligvarer til gode priser. Målet er at gøre det lettere at omsætte et madbudget til konkrete måltider og indkøb.
          </P>
          <P>
            Altid Mad er en del af Altid Hjem, som samler hjemmets faste udgifter med ét overblik og ét login. Teamet står også bag Altid Energi, Danmarks første gebyrfri energiselskab.
          </P>
          <P>
            Appen er ikke lanceret endnu. I kan skrive jer på ventelisten på altidmad.dk, hvis I vil følge med.
          </P>
        </div>


        <FaqAccordion faq={FAQ} />

        <div id="venteliste">
          <BottomCta
            eyebrow='Fra estimat til besparelse'
            subtitle='Skriv dig på ventelisten, så får du besked, når Altid Mad er klar til at hente estimatet hjem i hverdagen. Gratis.'
            source='beregn-dit-madbudget'
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
