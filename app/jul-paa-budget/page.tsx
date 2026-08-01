import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import JulekurvMockup from '@/components/JulekurvMockup'
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
  title: 'Jul på budget: Spar på julemaden – Altid Mad',
  description:
    'Få en jul på budget med en planlagt menu, tilbudskøb og mindre madspild. Se konkrete råd til billig julemad, og skriv dig på ventelisten.',
}

// FAQ copy is used twice: rendered on the page AND serialized as FAQPage
// schema (rich results). Keep the two in sync by editing only this array.
const FAQ: FaqItem[] = [
  {
    q: 'Hvad koster julemiddagen for en familie?',
    a: [
      'Det afhænger af menuen, antallet af gæster og de varer, I vælger.',
      'Det vigtigste er at beslutte et beløb på forhånd og tilpasse menuen, før indkøbene begynder.',
    ],
  },
  {
    q: 'Hvornår skal jeg købe ind til jul?',
    a: [
      'Køb langtidsholdbare og fryseegnede varer i ugerne op til jul, når de er på tilbud.',
      'Vent med de mest letfordærvelige varer, og lav en opdelt indkøbsliste, så intet bliver købt to gange.',
    ],
  },
  {
    q: 'Er julevarer billigere før eller efter jul?',
    a: [
      'Mange julevarer er på tilbud i ugerne op til jul, men det varierer mellem butikker og produkter.',
      'Efter jul kan der være udsalg, men udvalget og holdbarheden kan være begrænset.',
    ],
  },
  {
    q: 'Hvordan undgår vi madspild i julen?',
    a: [
      'Planlæg portionerne efter gæsterne, og beslut på forhånd, hvordan resterne skal bruges.',
      'Køl maden hurtigt ned, frys overskud ned, og indlæg restedage mellem de større måltider.',
    ],
  },
  {
    q: 'Hvad med julefrokosten?',
    a: [
      'Hold menuen overskuelig, og vælg de retter, gæsterne faktisk ønsker.',
      'Ved sammenskud kan hver husstand medbringe en aftalt ret, så udgifterne fordeles, og I undgår dubletter.',
    ],
  },
  {
    q: 'Kan Altid Mad hjælpe med julen?',
    a: [
      'Ja, Altid Mad er udviklet til at læse tilbudsaviserne, foreslå en madplan efter familiens smag og finde dagligvarerne til de bedste priser.',
      'Appen er ikke lanceret endnu, men I kan skrive jer på ventelisten på altidmad.dk.',
    ],
  },
]

export default function JulPaaBudget() {
  return (
    <>
      <Nav
        banner={{
          longPrefix: 'Jul på budget: planlæg indkøbene, før december æder budgettet. ',
          shortPrefix: 'Jul på budget? ',
          source: 'jul-paa-budget-banner',
        }}
      />
      <FaqSchemaScript faq={FAQ} />
      <main
        className="min-h-screen pt-32 pb-0"
        style={{ background: '#fdfaf4', fontFamily: 'var(--font-onest)', color: FOREST }}
      >
        <div className="max-w-2xl mx-auto px-6 pb-4">
          <BackLink />

          <h1 className="text-3xl sm:text-4xl font-normal mb-1 text-balance">Jul på budget uden at spare på hyggen</h1>
          <p className="text-xs mb-10" style={{ color: FAINT_INK }}>
            Opdateret: 2026
          </p>

          <P>
            Julen behøver ikke vælte familiens madbudget. Når I planlægger menuen og indkøbene i god tid, bliver det lettere at prioritere det, I holder mest af.
          </P>
          <P>
            Panikindkøb i december gør det svært at sammenligne priser og bruge råvarerne fornuftigt. En enkel plan giver jer bedre overblik, mindre madspild og mere ro omkring julebordet.
          </P>
        </div>


        <div className="max-w-2xl mx-auto px-6 pb-20">
          <H2>Læg julemadbudgettet i god tid</H2>
          <P>
            Beslut på forhånd, hvor meget I vil bruge på julemiddag, julefrokoster, snacks og øvrige måltider. Fordel gerne beløbet mellem de forskellige anledninger, så hele budgettet ikke forsvinder på én dyr indkøbstur.
          </P>
          <P>
            Forbrugsundersøgelsen 2024 fra Danmarks Statistik viser, at 2 voksne med børn i gennemsnit bruger 65.775 kr. om året på fødevarer og ikke-alkoholiske drikkevarer. Tallet dækker hele årets forbrug og kan derfor ikke bruges som en pris på julemad, men det kan hjælpe jer med at se julens indkøb i forhold til familiens almindelige madbudget.
          </P>
          <P>
            Skriv menuen ned, gennemgå skabe og fryser, og lav derefter indkøbslisten. I kan få flere konkrete metoder i vores guide til <A href="/madbudget">madbudget</A>.
          </P>
          <H2>Find de dyre valg i julemenuen</H2>
          <P>
            And, flæskesteg og andet kød fylder ofte meget i julebudgettet. Vælg først hovedretten, og byg derefter tilbehøret op omkring råvarer, som både passer til menuen og kan bruges i dagene efter.
          </P>
          <P>
            Tilbudsaviserne er fulde af julevarer fra november. Køb ikke-letfordærvelige varer, når de er på tilbud i ugerne op til jul, men undgå at købe noget alene, fordi prisen ser god ud.
          </P>
          <P>
            Prissammenligning kan gøre en mærkbar forskel året rundt. I Altid Mads analyse kostede den samme kurv med 23 varer til 2 voksne og 2 teenagere 802,79 kr. hos Rema 1000 og 1.020,20 kr. hos Spar, en forskel på 21,3 pct. Det svarer til op til 11.305 kr. om året, og hvis hver vare købes dér, hvor den er billigst, op til 15.481 kr. om året. Læs mere om analysen af <A href="/billigste-supermarked">det billigste supermarked</A>.
          </P>
          <H2>Spred indkøbene over ugerne før jul</H2>
          <P>
            Alt behøver ikke blive købt i den samme uge. Basisvarer med lang holdbarhed kan komme i kurven, når de er på tilbud, mens friske varer kan vente til tættere på den dag, hvor de skal bruges.
          </P>
          <P>
            Kød og andre fryseegnede varer kan købes tidligere, hvis I har plads i fryseren. Mærk pakkerne tydeligt, og skriv dem ind i madplanen, så de ikke bliver glemt.
          </P>
          <P>
            Hold indkøbslisten opdelt efter anledning og holdbarhed. Så kan I bedre se, hvad der mangler, og undgå dobbeltkøb.
          </P>
          <MidCta label="Få julen planlagt efter tilbuddene" />
          <H2>Gør julefrokosten lettere at styre</H2>
          <P>
            Til en julefrokost er det nemt at ende med flere retter, end gæsterne kan spise. Vælg færre favoritter, planlæg portionerne efter antallet af gæster, og tænk over, hvilke retter der kan gemmes.
          </P>
          <P>
            Hvis flere familier mødes, kan I bruge sammenskudsprincippet. Lad hver husstand tage en aftalt ret med, så både arbejdet og udgifterne bliver fordelt.
          </P>
          <P>
            Aftal retterne på forhånd, så I ikke står med flere næsten ens fade. Spørg også gæsterne, hvad de faktisk glæder sig til, før menuen vokser.
          </P>
          <H2>Brug resterne som planlagte måltider</H2>
          <P>
            Rester er nemmere at få brugt, når de allerede indgår i planen. Juleand kan blive til andesalat eller fyld i en sandwich, mens kartofler og grønt kan bruges i biksemad, supper eller lune frokostretter.
          </P>
          <P>
            Sæt maden på køl hurtigt, opbevar den i lukkede beholdere, og frys det ned, I ikke får spist i tide. Skriv indhold og dato på beholderen, så resterne er nemme at finde igen.
          </P>
          <P>
            Planlæg gerne et par enkle restedage mellem julens større måltider. Det mindsker madspild og giver en tiltrængt pause fra nye indkøb.
          </P>
          <H2>Sådan kan Altid Mad hjælpe</H2>
          <P>
            Altid Mad bliver en dansk app, der læser tilbudsaviserne, lærer familiens smag at kende og bygger en madplan med ugens dagligvarer til de bedste priser. Det gælder også tilbud på julevarer, når de dukker op i butikkerne.
          </P>
          <P>
            Appen er ikke lanceret endnu, men ventelisten er åben på altidmad.dk. Indtil da kan I bruge principperne her og vores guide til en <A href="/madplan-efter-tilbud">madplan efter tilbud</A>.
          </P>
          <P>
            Altid Mad er en del af Altid Hjem, som samler hjemmets faste udgifter med ét overblik og ét login. Teamet står også bag Altid Energi, Danmarks første gebyrfrie energiselskab.
          </P>
        </div>

        <MockupFrame caption="Juleindkøbene spredt over ugerne op til jul, planlagt efter tilbud.">
          <JulekurvMockup />
        </MockupFrame>
        <FaqAccordion faq={FAQ} />

        <div id="venteliste">
          <BottomCta
            eyebrow='Julen planlagt, budgettet helt'
            subtitle='Skriv dig på ventelisten, så får du besked, når Altid Mad kan planlægge højtiderne med jer. Gratis.'
            source='jul-paa-budget'
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
