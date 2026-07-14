import type { Metadata } from 'next'
import Link from 'next/link'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Privatlivspolitik – Altid Hjem',
  description: 'Læs om hvordan Altid Hjem ApS behandler dine personoplysninger.',
}

export default function Privatlivspolitik() {
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-28 pb-24" style={{ background: 'var(--forest)', fontFamily: 'var(--font-onest)' }}>
        <div className="max-w-2xl mx-auto px-6">

          <Link href="/" className="inline-flex items-center gap-2 text-sm mb-10 text-white/55 transition-colors hover:text-white/85">
            <span aria-hidden="true">←</span> Tilbage
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Privatlivspolitik</h1>
          <p className="text-sm mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Altid Hjem ApS · CVR 45637476 · hej@altidhjem.dk</p>
          <p className="text-xs mb-12" style={{ color: 'rgba(255,255,255,0.55)' }}>Senest opdateret: juni 2026</p>

          <div className="space-y-10 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">1. Vi er den dataansvarlige</h2>
              <p className="mb-3">Altid Hjem ApS, CVR 45637476, er dataansvarlig for behandlingen af de personoplysninger, som vi indsamler om dig i forbindelse med din brug af Altid Hjem-appen, vores websteder (herunder altidhjem.dk og altidmad.dk) og vores tilknyttede tjenester (Altid Mad, Altid Forsikring, Altid Mobil m.fl.). Altid Mad er en tjeneste i Altid Hjem, og Altid Hjem ApS er dataansvarlig for de personoplysninger, du afgiver via altidmad.dk.</p>
              <p className="mb-3">Når du via appen opretter dig som kunde hos eller tilgår din selvbetjening hos Altid Energi, er det Altid Energi ApS (CVR 44373580), der er selvstændig dataansvarlig for behandlingen af dine personoplysninger som elkunde. Du kan læse om Altid Energis behandling af personoplysninger på <a href="https://altidenergi.dk/datapolitik/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-colors hover:text-white">altidenergi.dk/datapolitik</a>.</p>
              <p>Har du spørgsmål til vores behandling af dine personoplysninger, er du velkommen til at kontakte os:</p>
              <div className="mt-3 pl-4" style={{ borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                <p className="font-medium text-white">Altid Hjem ApS</p>
                <p>Helsinkigade 29, 2150 Nordhavn</p>
                <p><a href="mailto:hej@altidhjem.dk" className="underline underline-offset-2 transition-colors hover:text-white">hej@altidhjem.dk</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">2. Venteliste (før lancering)</h2>
              <p className="mb-3">Indtil Altid Hjem-appen er lanceret, kan du tilmelde dig vores venteliste via altidhjem.dk eller altidmad.dk. Der er tale om én fælles venteliste, som Altid Hjem ApS er dataansvarlig for. Følgende særlige regler gælder for behandlingen af oplysninger fra ventelisten – afsnit 8 (Dine rettigheder) og afsnit 9 (Klage) gælder også for ventelisteoplysninger.</p>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-white">Hvilke oplysninger indsamler vi?</p>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Navn</li>
                    <li>E-mailadresse</li>
                    <li>Mobilnummer (valgfrit)</li>
                    <li>Valgfrie svar på spørgsmål om din husstand og energiforbrug</li>
                    <li>Hvilken side på altidhjem.dk du tilmeldte dig fra</li>
                    <li>Om du er tilmeldt via en invitation fra en anden person på ventelisten</li>
                    <li>Oplysninger om din interaktion med vores e-mails (om en e-mail åbnes, og hvilke links der klikkes på)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-white">Formål og retsgrundlag</p>
                  <p>Vi behandler oplysningerne for at kunne give dig besked, når Altid Hjem og de tilknyttede tjenester – herunder Altid Mad – lanceres, og for at forstå, hvem vores tidlige brugere er. Retsgrundlaget er dit samtykke (GDPR artikel 6, stk. 1, litra a), som du til enhver tid kan trække tilbage via afmeldingslinket i vores e-mails eller ved at skrive til <a href="mailto:hej@altidhjem.dk" className="underline underline-offset-2 transition-colors hover:text-white">hej@altidhjem.dk</a>. Selve lanceringsbeskeden er markedsføring efter markedsføringslovens § 10, men sendes på grundlag af din tilmelding til ventelisten, som udgør dit forudgående, specifikke samtykke til netop den besked; den indeholder kun information om lancering og adgang.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">E-mailstatistik</p>
                  <p>Vores e-mails kan indeholde en lille sporingspixel og sporbare links, der fortæller os, om en e-mail bliver åbnet, og hvilke links der klikkes på. Vi bruger oplysningerne til at måle og forbedre vores kommunikation. Behandlingen sker på grundlag af dit samtykke og ophører fremadrettet, hvis du afmelder dig via afmeldingslinket i vores e-mails — allerede indsamlede oplysninger slettes efter opbevaringsreglerne nedenfor. I de fleste e-mailprogrammer kan du desuden undgå åbningsregistrering ved at slå automatisk billedvisning fra. Vores e-mails udsendes via vores databehandler Resend; eventuelle overførsler til lande uden for EU/EØS sker som beskrevet i afsnit 6.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Opbevaring</p>
                  <p>Dine ventelisteoplysninger opbevares sikkert hos vores databehandlere i EU/EØS og slettes senest 12 måneder efter Altid Hjems lancering, eller tidligere hvis du anmoder om det.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">3. Hvilke oplysninger behandler vi?</h2>
              <div className="space-y-3">
                {[
                  { title: 'Kontaktoplysninger', text: 'Navn, e-mailadresse, telefonnummer og bopælsadresse.' },
                  { title: 'Boligoplysninger', text: 'Adresse, boligtype og relevante oplysninger om dit hjem, som du angiver i appen.' },
                  { title: 'Produkt- og aftaleoplysninger', text: 'Oplysninger om de produkter og aftaler du har hos os eller vores datterselskaber, herunder el, forsikring og mobil.' },
                  { title: 'Forbrugsdata', text: 'Data om dit energiforbrug og øvrige forbrug, som vi modtager fra dig eller fra relevante leverandører og offentlige registre.' },
                  { title: 'Betalingsoplysninger', text: 'Betalingskortoplysninger og øvrige betalingsdata i forbindelse med køb og tilmelding til produkter via appen. Betalingsoplysninger behandles via godkendte betalingsudbydere og opbevares ikke direkte af Altid Hjem.' },
                  { title: 'Tekniske oplysninger', text: 'Oplysninger om din enhed, operativsystem, app-version og brugsadfærd i appen.' },
                  { title: 'Kommunikationsoplysninger', text: 'Korrespondance du har haft med os via e-mail, chat eller support.' },
                ].map(({ title, text }) => (
                  <div key={title}>
                    <p className="font-semibold text-white">{title}</p>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">4. Formål og retsgrundlag</h2>
              <div className="space-y-3">
                {[
                  { title: 'Levering og administration af appen og vores tjenester', text: 'Retsgrundlag: Opfyldelse af aftale (GDPR artikel 6, stk. 1, litra b).' },
                  { title: 'Tilmelding til og administration af produkter fra Altid Forsikring, Altid Mobil og øvrige datterselskaber', text: 'Retsgrundlag: Opfyldelse af aftale (GDPR artikel 6, stk. 1, litra b).' },
                  { title: 'Modtagelse af kontaktoplysninger fra Altid Energi og videregivelse af kontaktoplysninger til Altid Energi i forbindelse med oprettelse af kundeforhold', text: 'Retsgrundlag: Dit samtykke (GDPR artikel 6, stk. 1, litra a).' },
                  { title: 'Samling og visning af dine bolig- og forbrugsdata i ét overblik', text: 'Retsgrundlag: Opfyldelse af aftale og legitim interesse (GDPR artikel 6, stk. 1, litra b og f).' },
                  { title: 'Kommunikation og support', text: 'Retsgrundlag: Legitim interesse (GDPR artikel 6, stk. 1, litra f).' },
                  { title: 'Markedsføring og personaliserede tilbud fra Altid Hjem og datterselskaber', text: 'Retsgrundlag: Samtykke (GDPR artikel 6, stk. 1, litra a). Du kan til enhver tid trække dit samtykke tilbage.' },
                  { title: 'Opfyldelse af lovkrav', text: 'Retsgrundlag: Retlig forpligtelse (GDPR artikel 6, stk. 1, litra c).' },
                ].map(({ title, text }) => (
                  <div key={title}>
                    <p className="font-semibold text-white">{title}</p>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">5. Deling af oplysninger</h2>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-white">Tjenester og datterselskaber i Altid Hjem-koncernen</p>
                  <p>Herunder Altid Mad, Altid Forsikring og Altid Mobil, i det omfang det er nødvendigt for at levere de tjenester, du har tilmeldt dig eller ønsker at tilmelde dig. Altid Hjem ApS er dataansvarlig for de personoplysninger, du afgiver til Altid Hjem og Altid Mad, og deler kun relevante oplysninger med de enkelte tjenester i det omfang, det er nødvendigt for at levere dem til dig. Bemærk at et selvstændigt selskab kan være selvstændig dataansvarlig for den behandling, der sker i forbindelse med dets egne produkter og aftaler.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Datadeling med Altid Energi</p>
                  <p className="mb-2">Datadeling mellem Altid Hjem og Altid Energi forudsætter altid dit aktive samtykke i appen og kan gå begge veje:</p>
                  <ul className="space-y-2 list-disc list-outside ml-5">
                    <li><span className="font-medium text-white/80">Modtagelse af data fra Altid Energi:</span> Hvis du er elkunde hos Altid Energi og samtykker til at oprette en konto hos Altid Hjem, modtager vi følgende oplysninger fra Altid Energi: navn, e-mailadresse, telefonnummer og adresse.</li>
                    <li><span className="font-medium text-white/80">Videregivelse af data til Altid Energi:</span> Hvis du som Altid Hjem-kunde samtykker til at oprette dig som elkunde hos Altid Energi, videregiver vi de til enhver tid gældende oplysninger, der er nødvendige for oprettelse af et elkundeforhold.</li>
                  </ul>
                  <p className="mt-2">Samtykket er engangs – det udløser én konkret overførsel og er forbrugt i samme handling. Dine efterfølgende rettigheder (sletning, indsigt, berigtigelse) reguleres af de almindelige GDPR-regler hos den modtagende dataansvarlige. Altid Energis datapolitik kan læses på <a href="https://altidenergi.dk/datapolitik/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-colors hover:text-white">altidenergi.dk/datapolitik</a>.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Databehandlere</p>
                  <p>Som behandler oplysninger på vores vegne, herunder udbydere af hosting, betalingsinfrastruktur, kundesupport, analyseværktøjer og e-mailudsendelse. Alle databehandlere er underlagt en databehandleraftale og må kun behandle dine oplysninger efter vores instruks.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Offentlige myndigheder</p>
                  <p>Hvis vi er retligt forpligtet hertil.</p>
                </div>
                <p>Vi sælger ikke dine personoplysninger til tredjeparter.</p>
              </div>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">6. Overførsler til tredjelande</h2>
              <p>Hvis vi overfører dine oplysninger til lande uden for EU/EØS, sker det udelukkende på grundlag af et lovligt overførselsgrundlag, herunder EU-Kommissionens standardkontraktbestemmelser. Du kan få nærmere oplysninger ved at kontakte os.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">7. Opbevaring</h2>
              <p className="mb-3">Vi opbevarer dine personoplysninger så længe det er nødvendigt til de formål, de er indsamlet til, eller så længe vi er forpligtet til det efter lovgivningen. Generelt gælder:</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Kundedata opbevares i op til 5 år efter aftalens ophør af hensyn til bogføringsloven.</li>
                <li>Tekniske logs og brugsdata slettes løbende og typisk inden for 12 måneder.</li>
                <li>Oplysninger indsamlet på baggrund af samtykke slettes, når samtykket trækkes tilbage, medmindre andet retsgrundlag gælder.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">8. Dine rettigheder</h2>
              <p className="mb-3">Du har følgende rettigheder i henhold til databeskyttelsesforordningen:</p>
              <ul className="space-y-2">
                {[
                  { right: 'Indsigt', desc: 'Du kan anmode om at se de oplysninger, vi behandler om dig.' },
                  { right: 'Berigtigelse', desc: 'Du kan bede os om at rette unøjagtige oplysninger.' },
                  { right: 'Sletning', desc: 'Du kan i visse tilfælde bede os om at slette dine oplysninger.' },
                  { right: 'Begrænsning', desc: 'Du kan bede os om at begrænse behandlingen af dine oplysninger.' },
                  { right: 'Dataportabilitet', desc: 'Du kan i visse tilfælde anmode om at modtage dine oplysninger i et struktureret, maskinlæsbart format.' },
                  { right: 'Indsigelse', desc: 'Du kan gøre indsigelse mod vores behandling, herunder mod direkte markedsføring.' },
                  { right: 'Tilbagetrækning af samtykke', desc: 'Du kan til enhver tid trække et samtykke tilbage, uden at dette berører lovligheden af behandlingen forud for tilbagetrækningen.' },
                ].map(({ right, desc }) => (
                  <li key={right} className="flex gap-2">
                    <span className="font-semibold text-white shrink-0">{right}:</span>
                    <span>{desc}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3">Du udøver dine rettigheder ved at kontakte os på <a href="mailto:hej@altidhjem.dk" className="underline underline-offset-2 transition-colors hover:text-white">hej@altidhjem.dk</a>. Vi besvarer din henvendelse inden for 30 dage.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">9. Klage</h2>
              <p className="mb-3">Hvis du er utilfreds med vores behandling af dine personoplysninger, har du ret til at indgive en klage til Datatilsynet:</p>
              <div className="pl-4" style={{ borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
                <p className="font-medium text-white">Datatilsynet</p>
                <p>Carl Jacobsens Vej 35, 2500 Valby</p>
                <p><a href="mailto:dt@datatilsynet.dk" className="underline underline-offset-2 transition-colors hover:text-white">dt@datatilsynet.dk</a></p>
                <p><a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-colors hover:text-white">datatilsynet.dk</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-3">10. Ændringer</h2>
              <p>Vi opdaterer løbende denne privatlivspolitik. Den gældende version er altid tilgængelig i appen og på vores hjemmeside. Væsentlige ændringer vil blive kommunikeret til dig via appen eller e-mail.</p>
            </section>

          </div>
        </div>
      </main>
    </>
  )
}
