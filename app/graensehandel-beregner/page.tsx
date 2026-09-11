import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import GraensehandelCalculator from '@/components/GraensehandelCalculator'
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
  title: 'Kan grænsehandel betale sig? – Altid Mad',
  description:
    'Beregn, om grænsehandel kan betale sig. Se transportens pris og dit break-even, før I kører, og få et ærligt regnestykke fra Altid Mad.',
}

// FAQ copy is used twice: rendered on the page AND serialized as FAQPage
// schema (rich results). Keep the two in sync by editing only this array.
const FAQ: FaqItem[] = [
  {
    q: 'Kan grænsehandel betale sig?',
    a: [
      'Ja, hvis jeres reelle besparelse er større end udgiften til transporten og værdien af jeres tid.',
      'Brug beregneren med jeres egen afstand, bilens forbrug og den kurv, I faktisk vil købe.',
    ],
  },
  {
    q: 'Hvor langt kan man køre, før besparelsen er væk?',
    a: [
      'Det afhænger af bilens forbrug, brændstofprisen og besparelsen på varerne.',
      'Kører I 100 km tur-retur i en bil, der kører 15 km pr. liter, koster turen ca. 118 kr. i brændstof ved en pris på 17,69 kr. pr. liter.',
    ],
  },
  {
    q: 'Hvad er billigst i Tyskland?',
    a: [
      'Prisfordelen forbindes ofte med afgiftsvarer som slik, sodavand og øl.',
      'Sammenlign altid de konkrete mærker, mængder og tilbud, fordi grænsehandel ikke automatisk er billigst på alle dagligvarer.',
    ],
  },
  {
    q: 'Tæller tiden med?',
    a: [
      'Ja, hvis I vil kende turens reelle omkostning.',
      'Sæt eventuelt en personlig værdi på køretiden og læg den oven i udgifterne til brændstof.',
    ],
  },
  {
    q: 'Er der regler for, hvor meget man må tage med hjem?',
    a: [
      'Ja, der gælder regler og vejledende mængder for blandt andet alkohol og tobak, når varer medbringes til eget brug inden for EU.',
      'Tjek altid de aktuelle oplysninger på Skat.dk før turen.',
    ],
  },
  {
    q: 'Kan vi spare det samme herhjemme?',
    a: [
      'Det kan være muligt, men det afhænger af jeres indkøb og de aktuelle tilbud.',
      'Sammenlign priser, planlæg måltiderne og brug eventuelt vores guide til et bedre madbudget før I beslutter jer for at køre.',
    ],
  },
]

export default function GraensehandelBeregner() {
  return (
    <>
      <Nav
        banner={{
          longPrefix: 'Kan grænsehandel betale sig? Regn turen efter. ',
          shortPrefix: 'Grænsehandel? ',
          source: 'graensehandel-banner',
        }}
      />
      <FaqSchemaScript faq={FAQ} />
      <main
        className="min-h-screen pt-32 pb-0"
        style={{ background: '#fdfaf4', fontFamily: 'var(--font-onest)', color: FOREST }}
      >
        <div className="max-w-2xl mx-auto px-6 pb-4">
          <BackLink />

          <h1 className="text-3xl sm:text-4xl font-normal mb-1 text-balance">Kan grænsehandel betale sig?</h1>
          <p className="text-xs mb-10" style={{ color: FAINT_INK }}>
            Opdateret: september 2026
          </p>

          <P>
            Det afhænger af transporten og det, I lægger i kurven. En billig indkøbstur er kun billig, hvis besparelsen overstiger udgifterne til at komme frem og tilbage.
          </P>
          <P>
            Med vores grænsehandel-beregner kan du indtaste afstanden til grænsen, bilens forbrug, brændstofprisen og den besparelse, I forventer. Så får du transportprisen og jeres break-even, altså hvor meget I mindst skal spare, før turen betaler sig.
          </P>
          <P>
            Brændstofprisen er forudfyldt med Drivkraft Danmarks listepris for benzin i juli 2026 på 17,69 kr. pr. liter. Prisen kan redigeres, så beregningen passer til den pris, I faktisk betaler.
          </P>
        </div>

        <MockupFrame caption="Regn brændstof og break-even ud, før I kører mod grænsen. Intet gemmes.">
          <GraensehandelCalculator />
        </MockupFrame>
        <div className="max-w-2xl mx-auto px-6 pb-20">
          <H2>Sådan regner du grænsehandlen ud</H2>
          <P>
            Start med den samlede køreafstand frem og tilbage. Divider afstanden med bilens kilometer pr. liter, og gang derefter med brændstofprisen.
          </P>
          <P>
            Resultatet er turens brændstofudgift. Det er samtidig det beløb, I mindst skal spare på varerne, før køreturen går i nul.
          </P>
          <P>
            Vil du have det fulde regnestykke, bør du også overveje, hvad jeres tid er værd. Beregneren viser den konkrete transportudgift, mens I selv kan vurdere, om tidsforbruget gør turen attraktiv.
          </P>
          <H2>Hvad sparer man typisk på ved grænsehandel?</H2>
          <P>
            Grænsehandel forbindes især med afgiftsvarer som slik, sodavand og øl. Den faktiske besparelse afhænger dog af mærke, pakningsstørrelse, tilbud og den aktuelle pris i Danmark.
          </P>
          <P>
            Sammenlign derfor de varer, I reelt vil købe, i stedet for at vurdere turen ud fra enkelte lokkepriser. Skriv den forventede samlede besparelse i beregneren, så den bliver holdt op mod transportudgiften.
          </P>
          <H2>Det glemmer mange i regnestykket</H2>
          <P>
            Impulskøb kan hurtigt spise en forventet besparelse. Lav en indkøbsliste hjemmefra, sammenlign samme mængder og kvaliteter, og køb kun stort ind, hvis familien faktisk får varerne brugt inden holdbarhedsdatoen.
          </P>
          <P>
            Undersøg også emballage og pantsystem, hvis I køber drikkevarer. Det kan have betydning for, hvor og hvordan emballagen kan afleveres.
          </P>
          <P>
            Endelig kan danske tilbud mindske prisforskellen. Se, hvordan en <A href="/madplan-efter-tilbud">madplan efter tilbud</A> kan samle ugens måltider omkring de varer, der allerede er billige herhjemme.
          </P>
          <H2>Kan besparelsen hentes uden køreturen?</H2>
          <P>
            Ja, en del familier kan spare ved at sammenligne danske supermarkeder og planlægge indkøbene bedre. I Altid Mads analyse kostede den samme ugentlige kurv med 23 varer til 2 voksne og 2 teenagere 782,70 kr. hos Lidl og 1.313,94 kr. hos Min Købmand.
          </P>
          <P>
            Det er en forskel på 531,24 kr. om ugen, svarende til op til 27.624 kr. om året. Prisgabet på den samme kurv var 40,4 pct., uden at transport til grænsen skulle trækkes fra.
          </P>
          <P>
            Kurven blev også sammenlignet hos Netto, Bilka, Føtex, Nemlig.com og Min Købmand. Du kan læse mere om metoden på siden om <A href="/billigste-supermarked">det billigste supermarked</A>.
          </P>
          <MidCta label="Hent besparelsen uden at køre nogen steder" />
          <H2>Sådan kan Altid Mad hjælpe</H2>
          <P>
            Altid Mad er en kommende dansk app, som læser tilbudsaviserne, bygger en madplan efter familiens smag og finder ugens dagligvarer til de bedste priser. Ventelisten er åben på altidmad.dk.
          </P>
          <P>
            Altid Mad er en del af Altid Hjem, som samler hjemmets faste udgifter med ét overblik og ét login. Holdet står også bag Altid Energi, Danmarks første gebyrfrie energiselskab.
          </P>
        </div>


        <FaqAccordion faq={FAQ} />

        <div id="venteliste">
          <BottomCta
            eyebrow='Besparelsen uden kilometerne'
            subtitle='Skriv dig på ventelisten, så får du besked, når Altid Mad kan finde besparelsen i jeres egne butikker. Gratis.'
            source='graensehandel-beregner'
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
