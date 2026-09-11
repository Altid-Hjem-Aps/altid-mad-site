import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import SparVanerMockup from '@/components/SparVanerMockup'
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
  title: 'Spar penge på dagligvarer, praktisk guide – Altid Mad',
  description:
    'Spar penge på dagligvarer med madplan, indkøbsliste og gode butiksvaner. Se dokumenterede prisforskelle fra vores pristjek, og kom enkelt i gang i denne uge.',
}

// FAQ copy is used twice: rendered on the page AND serialized as FAQPage
// schema (rich results). Keep the two in sync by editing only this array.
const FAQ: FaqItem[] = [
  {
    q: 'Hvor meget kan man realistisk spare på dagligvarer?',
    a: [
      'Det afhænger af jeres nuværende butik, madspild og indkøbsvaner.',
      'I vores analyse var forskellen på den billigste og dyreste samlede kurv 531,24 kr. om ugen, svarende til op til 27.624 kr. om året.',
    ],
  },
  {
    q: 'Hvilket supermarked skal jeg vælge?',
    a: [
      'Vælg den butik, der samlet er billigst for de varer, jeres familie normalt køber.',
      'Lidl var billigst i vores konkrete analyse, men resultatet kan ændre sig med en anden indkøbsliste og andre tilbud.',
    ],
  },
  {
    q: 'Er tilbudsaviser stadig det værd?',
    a: [
      'Ja, især når tilbuddene bruges til at planlægge flere måltider med de samme råvarer.',
      'Besparelsen bliver mindre, hvis tilbud får dig til at købe varer, familien ikke mangler eller når at bruge.',
    ],
  },
  {
    q: 'Hjælper det at handle online?',
    a: [
      'Onlinehandel kan gøre det lettere at følge indkøbslisten og se kurvens pris undervejs.',
      'Det er dog ikke automatisk billigst, og i vores analyse var Nemlig.com ikke den billigste kæde for den samlede kurv.',
    ],
  },
  {
    q: 'Er discountmærker lige så gode?',
    a: [
      'Discountmærker kan være et godt valg, men kvalitet og smag varierer fra produkt til produkt.',
      'Prøv dem i de retter, hvor forskellen betyder mindst for jer, og behold de mærkevarer, som familien faktisk foretrækker.',
    ],
  },
  {
    q: 'Hvordan kommer jeg i gang i denne uge?',
    a: [
      'Tjek først skabe, køleskab og fryser, vælg ugens retter ud fra relevante tilbud, og skriv én samlet indkøbsliste.',
      'Vælg derefter en hovedbutik, og tag kun til en ekstra butik, hvis besparelsen opvejer tiden og transporten.',
    ],
  },
]

export default function SparPengePaaDagligvarer() {
  return (
    <>
      <Nav
        banner={{
          longPrefix: 'Vores pristjek: op til 27.624 kr. at spare på dagligvarer om året. ',
          shortPrefix: 'Spar på dagligvarer? ',
          source: 'spar-penge-banner',
        }}
      />
      <FaqSchemaScript faq={FAQ} />
      <main
        className="min-h-screen pt-32 pb-0"
        style={{ background: '#fdfaf4', fontFamily: 'var(--font-onest)', color: FOREST }}
      >
        <div className="max-w-2xl mx-auto px-6 pb-4">
          <BackLink />

          <h1 className="text-3xl sm:text-4xl font-normal mb-1 text-balance">Sådan sparer du penge på dagligvarer</h1>
          <p className="text-xs mb-10" style={{ color: FAINT_INK }}>
            Opdateret: september 2026
          </p>

          <P>
            Du behøver ikke ekstremkuponer eller besværlige regler for at spare penge på mad. De største besparelser kommer ofte fra en gennemtænkt madplan, den rigtige hovedbutik og færre spontane køb.
          </P>
          <P>
            I vores analyse kostede den samme kurv med 23 varer 782,70 kr. hos Lidl og 1.313,94 kr. hos Min Købmand. Det er en forskel på 531,24 kr. om ugen, svarende til op til 27.624 kr. om året, alene ved at vælge den billigste samlede kurv.
          </P>
        </div>


        <div className="max-w-2xl mx-auto px-6 pb-20">
          <H2>Vælg din hovedbutik med omhu</H2>
          <P>
            En billig enkeltvare gør ikke nødvendigvis hele indkøbsturen billig. Se derfor på prisen på de varer, I faktisk køber ofte, frem for at vælge butik efter ugens mest synlige tilbud.
          </P>
          <P>
            I vores sammenligning af Lidl, Rema 1000, Netto, 365discount, Meny, Bilka, Kvickly, Super Brugsen, Føtex, Brugsen, Nemlig.com, Spar og Min Købmand var prisforskellen på den samme kurv 40,4 pct. Den billigste samlede kurv kostede 782,70 kr., mens den dyreste kostede 1.313,94 kr.
          </P>
          <P>
            Beløbene svarer til cirka 3.392 kr. og 5.694 kr. om måneden, når ugepriserne skaleres direkte. Analysen gælder en bestemt kurv til 2 voksne og 2 teenagere, så jeres billigste butik kan afhænge af familiens egne vaner.
          </P>
          <P>
            Læs mere om, hvordan du sammenligner butikker, i vores guide til <A href="/billigste-supermarked">det billigste supermarked</A>.
          </P>
          <H2>Planlæg ugen, før du handler</H2>
          <P>
            Start med at se, hvilke råvarer der er på tilbud, og byg derefter ugens retter omkring dem. Det giver som regel mere end at lave en fast madplan først og bagefter lede efter rabatter på alle ingredienserne.
          </P>
          <P>
            Vælg retter, der deler råvarer, så en pose grøntsager, en bakke kød eller et bæger mejeriprodukt kan bruges flere gange. Tjek køleskab, fryser og skabe, før du skriver indkøbslisten.
          </P>
          <P>
            Det kan betale sig at fordele indkøbene, hvis butikkerne ligger naturligt på jeres vej. I analysen kostede kurven 616,86 kr. om ugen, hvis hver vare købes dér, hvor den er billigst, svarende til op til 36.248 kr. om året sammenlignet med den dyreste samlede kurv.
          </P>
          <P>
            Flere butiksture kræver dog tid og eventuel transport. Brug derfor vores guide til en <A href="/madplan-efter-tilbud">madplan efter tilbud</A>, og vælg kun ekstra stop, når besparelsen reelt er besværet værd.
          </P>
          <MidCta label="Lad Altid Mad gøre sparearbejdet" />
          <H2>Køb rigtigt ind i butikken</H2>
          <P>
            Skriv en konkret indkøbsliste, og hold dig til den, medmindre du finder en reel erstatning til en bedre pris. En vare er ikke et godt tilbud, hvis den ikke bliver brugt.
          </P>
          <P>
            Sammenlign kilopris eller literpris, ikke kun prisskiltets samlede beløb. Den største pakke er heller ikke automatisk billigst, især ikke hvis noget ender i skraldespanden.
          </P>
          <P>
            Spis gerne, før du handler, og læg impulskøb ind som et bevidst valg frem for en vane. Så bliver indkøbslisten et realistisk værktøj, ikke en regel, der er umulig at følge.
          </P>
          <H2>Brug resterne, og undgå madspild</H2>
          <P>
            Planlæg mindst én fleksibel ret, hvor rester kan indgå, eksempelvis suppe, pastaret, rugbrød eller en blandet ovnret. Det gør det lettere at bruge det, der er tilbage, uden at menuen føles som gentagelser.
          </P>
          <P>
            Opbevar rester synligt, skriv indhold på fryseposer, og flyt varer med kort holdbarhed frem i køleskabet. Kig efter mad til næste dag, før du åbner en ny pakke.
          </P>
          <P>
            Madspild bliver dyrt, fordi du både betaler for varen og for den erstatning, du senere køber. Små rutiner omkring opbevaring kan derfor være lige så vigtige som tilbudsprisen.
          </P>
          <H2>Tilpas planen til madpakker og højtider</H2>
          <P>
            Madpakker bliver nemmere at holde på budget, når de tænkes ind i aftensmaden. Kog lidt ekstra, eller vælg råvarer, som både kan bruges til måltider hjemme og i madkassen.
          </P>
          <P>
            Du finder konkrete idéer i vores guide til <A href="/madpakker-paa-budget">madpakker på budget</A>. Her handler det om variation og enkel forberedelse, ikke om at vælge den samme billige løsning hver dag.
          </P>
          <P>
            Ved højtider er det især menu, gæsteantal og indkøbstidspunkt, der påvirker budgettet. Vores guide til <A href="/jul-paa-budget">jul på budget</A> hjælper med at prioritere det vigtigste og skære det overflødige fra.
          </P>
          <H2>Sådan skal Altid Mad hjælpe</H2>
          <P>
            Altid Mad er en kommende dansk app, som læser tilbudsaviserne, bygger en madplan efter familiens smag og finder ugens dagligvarer til de bedste priser. Ventelisten er åben på altidmad.dk.
          </P>
          <P>
            Målet er at gøre det nemmere at bruge tilbud uden selv at sammenligne alle varer og butikker. Det skal stadig være familiens præferencer og hverdag, der bestemmer menuen.
          </P>
          <P>
            Altid Mad er en del af Altid Hjem, som samler hjemmets faste udgifter med ét overblik og ét login. Teamet står også bag Altid Energi, Danmarks første gebyrfrie energiselskab.
          </P>
        </div>

        <MockupFrame caption="Fem vaner der flytter madbudgettet, samlet som én ugeplan.">
          <SparVanerMockup />
        </MockupFrame>
        <FaqAccordion faq={FAQ} />

        <div id="venteliste">
          <BottomCta
            eyebrow='Slip for selv at holde øje med tilbuddene'
            subtitle='Skriv dig på ventelisten, så får du besked, når Altid Mad er klar til at finde ugens bedste priser for jer. Gratis.'
            source='spar-penge-paa-dagligvarer'
          />
        </div>
      </main>
      <Footer />
    </>
  )
}
