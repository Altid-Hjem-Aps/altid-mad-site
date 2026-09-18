import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import MadplanMockup from '@/components/MadplanMockup'
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
  title: 'Madplan efter tilbud, spar på ugens mad – Altid Mad',
  description:
    'Lav en madplan efter ugens tilbud, undgå dyre impulskøb og få en enkel metode til billigere hverdagsmad. Se guiden, og skriv dig på ventelisten.',
}

// FAQ copy is used twice: rendered on the page AND serialized as FAQPage
// schema (rich results). Keep the two in sync by editing only this array.
const FAQ: FaqItem[] = [
  {
    q: 'Hvordan laver jeg en madplan efter tilbud?',
    a: [
      'Gennemgå ugens tilbud først, vælg 3-4 realistiske retter, og skriv derefter indkøbslisten.',
      'Brug varer fra fryser og skabe som supplement, så I både reducerer indkøbet og undgår madspild.',
    ],
  },
  {
    q: 'Hvor meget sparer en madplan?',
    a: [
      'Besparelsen afhænger af jeres nuværende vaner, butikker og valg af varer.',
      'I Altid Mads analyse var forskellen på den samme kurv op til 27.624 kr. om året, mens besparelsen var op til 36.248 kr. om året, hvis hver vare købes dér, hvor den er billigst, sammenlignet med den dyreste kurv.',
    ],
  },
  {
    q: 'Hvilken dag skal jeg lægge madplanen?',
    a: [
      'Søndag er praktisk for mange familier, fordi I kan planlægge den kommende uge samlet.',
      'Den bedste dag er dog den, hvor de relevante tilbudsaviser er tilgængelige, og hvor du kan se familiens kalender.',
    ],
  },
  {
    q: 'Skal jeg handle i flere butikker?',
    a: [
      'Nej, ikke nødvendigvis.',
      'Vælg flere butikker, når besparelsen er tydelig og passer ind i jeres rute, men hold jer til én butik, hvis ekstra transport, tid eller impulskøb æder gevinsten.',
    ],
  },
  {
    q: 'Hvad gør jeg med resten af ugens tilbud?',
    a: [
      'Ignorér de tilbud, der ikke passer til planen eller familiens behov.',
      'Gem kun holdbare varer eller frysevarer til senere, når prisen er god, varen faktisk bliver brugt, og der er plads derhjemme.',
    ],
  },
  {
    q: 'Kan Altid Mad gøre det for mig?',
    a: [
      'Altid Mad skal kunne læse tilbudsaviserne, bygge en madplan efter familiens smag og finde ugens dagligvarer til de bedste priser.',
      'Appen er ikke lanceret endnu, men ventelisten er åben på altidmad.dk.',
    ],
  },
]

export default function MadplanEfterTilbud() {
  return (
    <>
      <Nav
        banner={{
          longPrefix: 'Madplan efter ugens tilbud er den vane, der flytter mest. ',
          shortPrefix: 'Madplan efter tilbud? ',
          source: 'madplan-efter-tilbud-banner',
        }}
      />
      <FaqSchemaScript faq={FAQ} />
      <main
        className="min-h-screen pt-32 pb-0"
        style={{ background: '#fdfaf4', fontFamily: 'var(--font-onest)', color: FOREST }}
      >
        <div className="max-w-2xl mx-auto px-6 pb-4">
          <BackLink />

          <h1 className="text-3xl sm:text-4xl font-normal mb-1 text-balance">Sådan laver du en madplan efter ugens tilbud</h1>
          <p className="text-xs mb-10" style={{ color: FAINT_INK }}>
            Opdateret: september 2026
          </p>

          <P>
            En madplan efter tilbud er en af de hverdagsvaner, der kan flytte mest i familiens madbudget. Metoden er enkel: Se tilbuddene, vælg retterne, og skriv derefter indkøbslisten.
          </P>
          <P>
            Det kræver lidt forberedelse, men du kan gøre det selv allerede i denne uge. Her får du en konkret metode til en billig madplan, som også tager højde for familiens smag, tid og appetit.
          </P>
        </div>


        <div className="max-w-2xl mx-auto px-6 pb-20">
          <H2>Begynd med tilbuddene, ikke med retterne</H2>
          <P>
            Hvis I vælger ugens retter først, risikerer I at købe råvarerne, når de er dyrest. Vend derfor rækkefølgen om: tilbud, madplan og til sidst indkøbsliste.
          </P>
          <P>
            Se især efter tilbud på de varer, der kan danne grundlag for et måltid. Det kan være kød, fisk, grøntsager, bælgfrugter eller andre råvarer, som familien faktisk kan lide.
          </P>
          <P>
            Byg derefter retterne op omkring disse varer, og brug det, I allerede har i fryseren og skabene. På den måde styrer tilbuddene indkøbet, uden at de får lov til at bestemme hele menuen.
          </P>
          <H2>Sådan laver du madplanen i praksis</H2>
          <P>
            Sæt tid af søndag til at gennemgå tilbudsaviserne. Vælg 3-4 retter med råvarer på tilbud, og lad resten af ugens måltider tage udgangspunkt i billige basisvarer og rester.
          </P>
          <P>
            Kontrollér køleskab, fryser og skabe, før du skriver indkøbslisten. Notér også, hvilke aftener der skal være hurtige, så planen passer til jeres virkelige uge.
          </P>
          <P>
            Mange tjenester viser kun tilbud fra én kæde. Men de bedste priser skifter mellem Lidl, Rema 1000, Netto, 365discount, Meny, Bilka, Kvickly, Super Brugsen, Føtex, Brugsen, Nemlig.com, Spar og Min Købmand fra uge til uge, så sammenligning kan gøre en reel forskel.
          </P>
          <P>
            Vil du arbejde mere systematisk med økonomien, kan du også bruge vores guide til <A href="/madbudget">madbudgettet</A> eller læse om et passende <A href="/madbudget-familie-paa-4">madbudget for en familie på 4</A>.
          </P>
          <MidCta label="Få madplanen lagt for jer" />
          <H2>Hvad kan det betyde i kroner?</H2>
          <P>
            Altid Mads analyse sammenlignede den samme ugentlige kurv med 23 varer hos 13 kæder. Kurven kostede 782,70 kr. hos Lidl og 1.313,94 kr. hos Min Købmand, en prisforskel på 40,4 pct.
          </P>
          <P>
            Forskellen var 531,24 kr. om ugen, svarende til op til 27.624 kr. om året. Kurven var beregnet til en husstand med 2 voksne og 2 teenagere.
          </P>
          <P>
            Hvis hver vare købes dér, hvor den er billigst, kostede kurven 616,86 kr. om ugen. Det svarer til op til 36.248 kr. om året sammenlignet med den dyreste samlede kurv, men kræver, at besparelsen er større end besværet og transporten.
          </P>
          <P>
            Tallene viser en mulig ramme, ikke et løfte om familiens besparelse. Se hele sammenligningen i vores guide til <A href="/billigste-supermarked">det billigste supermarked</A>.
          </P>
          <H2>Undgå de typiske faldgruber</H2>
          <P>
            Et tilbud er kun billigt, hvis I får varen brugt. Køb derfor ikke ekstra alene på grund af en gul mærkat, medmindre varen indgår i madplanen eller kan gemmes uden at skabe madspild.
          </P>
          <P>
            En for ambitiøs plan kan også blive dyr. Hvis alle retter kræver lang tilberedning, ender råvarerne lettere ubrugt på travle dage, så læg plads ind til rester og enkle måltider.
          </P>
          <P>
            Vær desuden forsigtig med at køre langt efter små besparelser. Flere butikker kan være fornuftigt, når prisforskellen er tydelig, men tid, transport og risikoen for impulskøb skal regnes med.
          </P>
          <H2>Lad Altid Mad gøre arbejdet</H2>
          <P>
            Altid Mad læser tilbudsaviserne, bygger en madplan efter familiens smag og finder ugens dagligvarer til de bedste priser. Det samler det arbejde, du ellers skal gøre på tværs af tilbud, retter og indkøbslister.
          </P>
          <P>
            Du bestemmer stadig, hvad der passer til familien. Altid Mad skal gøre det lettere at vælge realistiske måltider og gennemskue, hvor varerne er billigst den pågældende uge.
          </P>
          <P>
            Appen er en del af Altid Hjem, som samler hjemmets faste udgifter med ét overblik og ét login. Teamet står også bag Altid Energi, Danmarks første gebyrfrie energiselskab.
          </P>
          <P>
            Altid Mad er ikke lanceret endnu. Skriv dig på ventelisten på altidmad.dk, hvis du vil være blandt dem, der hører mere.
          </P>
        </div>

        <MockupFrame caption="Altid Mad læser tilbudsaviserne og bygger ugens madplan, før du handler.">
          <MadplanMockup />
        </MockupFrame>
        <FaqAccordion faq={FAQ} />

        <div id="venteliste">
          <BottomCta
            eyebrow='Slip for søndagsarbejdet med aviserne'
            subtitle='Skriv dig på ventelisten, så får du besked, når Altid Mad kan lægge madplanen efter ugens tilbud for jer. Gratis.'
            source='madplan-efter-tilbud'
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
