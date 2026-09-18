import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import TreTusindMockup from '@/components/TreTusindMockup'
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
  title: 'Mad for 3.000 om måneden, sådan gør I – Altid Mad',
  description:
    'Kan en familie få mad for 3.000 kr. om måneden? Se det ærlige regnestykke og konkrete greb, der hjælper jer tættere på. Få overblik hos Altid Mad.',
}

// FAQ copy is used twice: rendered on the page AND serialized as FAQPage
// schema (rich results). Keep the two in sync by editing only this array.
const FAQ: FaqItem[] = [
  {
    q: 'Kan en familie leve for 3.000 kr. mad om måneden?',
    a: [
      'Ja, nogle familier kan, men for en familie med børn er det et ambitiøst budget.',
      'Danmarks Statistik viser et gennemsnit på cirka 5.481 kr. om måneden for 2 voksne med børn, så 3.000 kr. kræver konsekvent planlægning og billige råvarer.',
    ],
  },
  {
    q: 'Hvad er realistisk for 2 personer?',
    a: [
      'Det afhænger af appetit, madpakker, kostbehov og hvor meget der allerede står i køkkenet.',
      'Danmarks Statistik opgør 2 voksne under 60 uden børn til cirka 3.478 kr. om måneden i gennemsnit, så 3.000 kr. kan være muligt med en stram plan.',
    ],
  },
  {
    q: 'Hvordan kommer vi fra 5.000 til 4.000 kr. om måneden?',
    a: [
      'Begynd med at planlægge aftensmad efter tilbud og vælge en billig hovedbutik.',
      'Brug råvarer på tværs af flere måltider, køb efter en fast liste, og følg madspildet, før I skærer mere fra.',
    ],
  },
  {
    q: 'Hvad koster den billigste uge i jeres analyse?',
    a: [
      'Den billigste samlede kurv kostede 782,70 kr. hos Lidl.',
      'Kurven indeholdt 23 varer til en husstand med 2 voksne og 2 teenagere og svarer til cirka 3.479 kr. om måneden.',
    ],
  },
  {
    q: 'Er det billigere at droppe kød?',
    a: [
      'Det kan være billigere at erstatte nogle kødretter med måltider baseret på bælgfrugter, æg, grøntsager og andre mættende råvarer.',
      'Besparelsen afhænger dog af de konkrete varer, tilbuddene og hvor godt I bruger resterne.',
    ],
  },
  {
    q: 'Hvor skal vi starte?',
    a: [
      'Start med at gennemgå jeres seneste indkøb og vælge et realistisk månedsbudget.',
      'Lav derefter en madplan ud fra køkkenets indhold og ugens tilbud, og tilmeld jer ventelisten hos Altid Mad, hvis I vil have hjælp til sammenligningen.',
    ],
  },
]

export default function MadFor3000OmMaaneden() {
  return (
    <>
      <Nav
        banner={{
          longPrefix: 'Mad for 3.000 kr. om måneden? Se det ærlige regnestykke. ',
          shortPrefix: 'Mad for 3.000 kr.? ',
          source: 'mad-for-3000-banner',
        }}
      />
      <FaqSchemaScript faq={FAQ} />
      <main
        className="min-h-screen pt-32 pb-0"
        style={{ background: '#fdfaf4', fontFamily: 'var(--font-onest)', color: FOREST }}
      >
        <div className="max-w-2xl mx-auto px-6 pb-4">
          <BackLink />

          <h1 className="text-3xl sm:text-4xl font-normal mb-1 text-balance">Kan en familie få mad for 3.000 kr. om måneden?</h1>
          <p className="text-xs mb-10" style={{ color: FAINT_INK }}>
            Opdateret: september 2026
          </p>

          <P>
            For en familie er 3.000 kr. til mad om måneden ambitiøst, men ikke umuligt. Det kræver en stram madplan, få impulskøb og retter, der bruger de samme billige råvarer på tværs af ugen.
          </P>
          <P>
            Ifølge Danmarks Statistiks Forbrugsundersøgelse 2024 bruger 2 voksne med børn i gennemsnit 65.775 kr. om året på fødevarer og ikke-alkoholiske drikkevarer. Det svarer til cirka 5.481 kr. om måneden.
          </P>
          <P>
            Til sammenligning svarer den billigste udgave af vores testkurv til cirka 3.479 kr. om måneden for 2 voksne og 2 teenagere. For mindre husstande er målet mere realistisk, men der skal stadig planlægges.
          </P>
        </div>


        <div className="max-w-2xl mx-auto px-6 pb-20">
          <H2>Hvad betyder 3.000 kr. til mad om måneden?</H2>
          <P>
            Et månedsbudget på 3.000 kr. svarer til cirka 692 kr. om ugen. Det skal dække alle de fødevarer og ikke-alkoholiske drikkevarer, I regner med i budgettet, ikke kun aftensmad.
          </P>
          <P>
            I vores analyse kostede den samme ugentlige kurv med 23 varer 782,70 kr. hos Lidl og 1.313,94 kr. hos Min Købmand. Forskellen var 531,24 kr. om ugen, svarende til 40,4 pct. eller op til 27.624 kr. om året.
          </P>
          <P>
            Testkurven er lavet til 2 voksne og 2 teenagere og kan derfor ikke sammenlignes direkte med alle husholdninger. Den viser dog tydeligt, at valg af butik kan afgøre, om budgettet holder.
          </P>
          <H2>Hvem kan realistisk ramme budgettet?</H2>
          <P>
            Jo færre personer der skal spise med, desto mere realistisk er 3.000 kr. om måneden. Børnenes alder, appetit, madpakker og behov for særlige fødevarer har også stor betydning.
          </P>
          <P>
            Danmarks Statistik opgør gennemsnittet til 41.851 kr. om året for en gennemsnitshusstand, cirka 3.488 kr. om måneden. Enlige med børn ligger på 38.564 kr. om året, cirka 3.214 kr. om måneden, mens 2 voksne under 60 uden børn ligger på 41.730 kr. om året, cirka 3.478 kr. om måneden.
          </P>
          <P>
            Forbrugsundersøgelsen 2024 dækker al mad og alle ikke-alkoholiske drikkevarer gennem året. En gennemsnitshusstand er cirka 2,1 personer, så tallene kan ikke sidestilles direkte med vores ugentlige kurv til 2 voksne og 2 teenagere.
          </P>
          <H2>Sådan kommer I tættest på 3.000 kr.</H2>
          <P>
            Vælg én hovedbutik med et lavt samlet prisniveau, og brug tilbud fra andre butikker selektivt. Se vores sammenligning af <A href="/billigste-supermarked">det billigste supermarked</A>, før I beslutter, hvor ugens store indkøb skal ligge.
          </P>
          <P>
            Lav derefter en <A href="/madplan-efter-tilbud">madplan efter tilbud</A>, hvor flere retter bruger de samme grøntsager, basisvarer og rester. Begynd med det, I allerede har, og skriv først derefter indkøbslisten.
          </P>
          <P>
            I vores analyse kostede hele kurven 616,86 kr. om ugen, hvis hver vare købes dér, hvor den er billigst. Det giver op til 36.248 kr. om året sammenlignet med den dyreste kurv, men besparelsen skal holdes op mod transport, tid og risikoen for ekstra impulskøb.
          </P>
          <MidCta label="Lad Altid Mad finde besparelsen for jer" />
          <H2>Det skal I ikke gøre for at spare</H2>
          <P>
            Et madbudget skal ikke holdes ved at springe måltider over eller spise for lidt. Et lavt budget fungerer kun, hvis maden stadig mætter, giver variation og passer til familiens hverdag.
          </P>
          <P>
            Undgå også at køre mellem mange butikker for små besparelser uden først at regne på turen. Det kan være bedre at vælge en billig hovedbutik og kun hente enkelte tilbud andre steder, når de ligger naturligt på jeres vej.
          </P>
          <P>
            Skær heller ikke alle hyggelige valg væk fra den ene uge til den anden. Et budget er lettere at fastholde, når der er plads til velkendte retter og små ønsker inden for den samlede ramme.
          </P>
          <H2>Find et realistisk madbudget for jeres familie</H2>
          <P>
            Start med jeres faktiske forbrug, ikke et ideal fra et forum. I forældrefora fortæller familier ofte om dagligvarebudgetter på 4.000 til 7.000 kr. om måneden, men deres husstande og vaner kan være meget forskellige.
          </P>
          <P>
            Gennemgå, hvad I køber, og hvilke varer der ofte bliver smidt ud. Brug derefter <A href="/beregn-dit-madbudget">madbudget-beregneren</A> til at sætte et mål, der både kræver omtanke og kan holde i hverdagen.
          </P>
          <P>
            Hvis 3.000 kr. er for stramt, kan et mindre første skridt stadig gøre en tydelig forskel. Det vigtigste er et budget, I kan følge uden sult, stress eller urealistiske regler.
          </P>
          <H2>Sådan kan Altid Mad hjælpe</H2>
          <P>
            Altid Mad er en kommende dansk app, som læser tilbudsaviserne, bygger en madplan efter familiens smag og finder ugens dagligvarer til de bedste priser. Ventelisten er åben på altidmad.dk.
          </P>
          <P>
            Appen bliver en del af Altid Hjem, der samler hjemmets faste udgifter med ét overblik og ét login. Teamet står også bag Altid Energi, Danmarks første gebyrfrie energiselskab.
          </P>
          <P>
            Tilmeld jer ventelisten, hvis I vil bruge mindre tid på at sammenligne tilbud og få et mere konkret grundlag for ugens madplan og indkøb.
          </P>
        </div>

        <MockupFrame caption="Regneeksemplet: 3.000 kr. om måneden holdt op mod den billigste testkurv.">
          <TreTusindMockup />
        </MockupFrame>
        <FaqAccordion faq={FAQ} />

        <div id="venteliste">
          <BottomCta
            eyebrow='Ærligt budget, ærlig hjælp'
            subtitle='Skriv dig på ventelisten, så får du besked, når Altid Mad kan presse jeres madbudget uden at presse familien. Gratis.'
            source='mad-for-3000-om-maaneden'
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
